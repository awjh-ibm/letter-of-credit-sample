package businesslogic

import (
	"defs"
	"encoding/json"
	"errors"
	"fmt"
	"helpers"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/contractapi"
)

// LetterOfCredit - logic for handling a letter of credit
type LetterOfCredit struct {
	contractapi.Contract
}

// Get - returns a JSON formatted letter of credit
func (loc *LetterOfCredit) Get(ctx *helpers.TransactionContext, letterID string, role string, participantID string) (string, error) {
	person, err := loc.getParticipantByRole(ctx, role, participantID)

	if err != nil {
		return "", err
	}

	letter, err := ctx.GetLetterOfCredit(letterID)

	if err != nil {
		return "", err
	}

	if !letter.IsParty(person) {
		return "", fmt.Errorf("Participant passed is not a party in the letter of credit")
	}

	lettersJSON, _ := json.Marshal(letter)

	return string(lettersJSON), nil
}

// Apply - create a new letter of credit
func (loc *LetterOfCredit) Apply(ctx *helpers.TransactionContext, letterID string, applicantID string, beneficiaryID string, rulesJSON string, productDetailsJSON string) error {
	rules, err := loc.parseRules(rulesJSON)

	if err != nil {
		return err
	}

	productDetails := defs.ProductDetails{}
	err = json.Unmarshal([]byte(productDetailsJSON), &productDetails)

	if err != nil {
		return fmt.Errorf("Could not convert passed JSON %s into productDetails object", productDetailsJSON)
	}

	// Errors caught in the gets will prevent create from running so don't need to catch
	applicant, err := ctx.GetCustomer(applicantID)

	if err != nil {
		return err
	}

	beneficiary, err := ctx.GetCustomer(beneficiaryID)

	if err != nil {
		return err
	}

	issuingBank := applicant.Bank
	exportingBank := beneficiary.Bank

	letter := defs.NewLetterOfCredit(letterID, *applicant, *beneficiary, issuingBank, exportingBank, rules, productDetails)

	ctx.CreateLetterOfCredit(letter)

	return err
}

// Approve - add approval to letter of credit
func (loc *LetterOfCredit) Approve(ctx *helpers.TransactionContext, letterID string, role string, participantID string) error {
	letter, err := loc.getEditableLetterOfCredit(ctx, letterID)

	if err != nil {
		return err
	}

	person, err := loc.getParticipantByRole(ctx, role, participantID)

	if !letter.IsSpecificParty(person, role) {
		return fmt.Errorf("Participant passed is not a valid %s", role)
	}

	letter.AddApproval(role)

	if letter.FullyApproved() {
		letter.SetStatus(defs.Approved)
	}

	return ctx.PutLetterOfCredit(letter)
}

// Reject - if the letter is not already approved reject it
func (loc *LetterOfCredit) Reject(ctx *helpers.TransactionContext, letterID string, role string, participantID string) error {
	letter, err := loc.getEditableLetterOfCredit(ctx, letterID)

	if err != nil {
		return err
	}

	person, err := loc.getParticipantByRole(ctx, role, participantID)

	if err != nil {
		return err
	}

	if !letter.IsParty(person) {
		return fmt.Errorf("Participant passed is not a party in the letter of credit")
	}

	letter.ClearApproval()
	letter.SetStatus(defs.Rejected)

	return ctx.PutLetterOfCredit(letter)
}

// SuggestRuleChange - Make changes to the rules
func (loc *LetterOfCredit) SuggestRuleChange(ctx *helpers.TransactionContext, letterID string, rulesJSON string, role string, participantID string) error {
	letter, err := loc.getEditableLetterOfCredit(ctx, letterID)

	if err != nil {
		return err
	}

	rules, err := loc.parseRules(rulesJSON)

	person, err := loc.getParticipantByRole(ctx, role, participantID)

	if !letter.IsParty(person) {
		return fmt.Errorf("Participant passed is not a party in the letter of credit")
	}

	letter.SetRules(rules)
	letter.ClearApproval()
	letter.AddApproval(role)

	return ctx.PutLetterOfCredit(letter)
}

// MarkAsShipped - Update the letter of credit with shipping information
func (loc *LetterOfCredit) MarkAsShipped(ctx *helpers.TransactionContext, letterID string, participantID string, evidenceJSON string) error {
	evidence := defs.Evidence{}
	err := json.Unmarshal([]byte(evidenceJSON), &evidence)

	if err != nil {
		return fmt.Errorf("Could not convert passed JSON %s into evidence", evidenceJSON)
	}

	letter, err := ctx.GetLetterOfCredit(letterID)

	if err != nil {
		return err
	}

	customer, err := ctx.GetCustomer(participantID)

	if err != nil {
		return err
	}

	if !letter.IsBeneficiary(*customer) {
		return errors.New("Participant passed is not beneficiary")
	} else if letter.GetStatus() == defs.AwaitingApproval {
		return errors.New("The letter of credit is not approved. Cannot ship")
	} else if letter.GetStatus() >= defs.Shipped {
		return errors.New("The letter of credit is already marked as having the products shipped or is closed")
	}

	letter.SetStatus(defs.Shipped)
	letter.AddEvidence(evidence)

	return ctx.PutLetterOfCredit(letter)
}

// MarkAsReceived - Update the letter of credit with acceptance of product
func (loc *LetterOfCredit) MarkAsReceived(ctx *helpers.TransactionContext, letterID string, participantID string) error {
	letter, err := ctx.GetLetterOfCredit(letterID)

	if err != nil {
		return err
	}

	customer, err := ctx.GetCustomer(participantID)

	if err != nil {
		return err
	}

	if !letter.IsApplicant(*customer) {
		return errors.New("Participant passed is not applicant")
	} else if letter.GetStatus() < defs.Shipped {
		return errors.New("The letter of credit is not shipped. Cannot receive")
	} else if letter.GetStatus() >= defs.Received {
		return errors.New("The letter of credit is already marked as having the products received or is closed")
	}

	letter.SetStatus(defs.Received)

	return ctx.PutLetterOfCredit(letter)
}

// MarkAsReadyForPayment - Update the letter of credit to show issuingBank is happy to pass payment
func (loc *LetterOfCredit) MarkAsReadyForPayment(ctx *helpers.TransactionContext, letterID string, participantID string) error {
	letter, err := ctx.GetLetterOfCredit(letterID)

	if err != nil {
		return err
	}

	banker, err := ctx.GetBankEmployee(participantID)

	if err != nil {
		return err
	}

	if !letter.IsIssuingBank(*banker) {
		return errors.New("Participant passed is not issuing bank")
	} else if letter.GetStatus() < defs.Received {
		return errors.New("The letter of credit is not received. Cannot get ready for payment")
	} else if letter.GetStatus() >= defs.ReadyForPayment {
		return errors.New("The letter of credit is already marked as being ready for payment or is closed")
	}

	letter.SetStatus(defs.ReadyForPayment)

	return ctx.PutLetterOfCredit(letter)
}

// Close - Close the letter of credit
func (loc *LetterOfCredit) Close(ctx *helpers.TransactionContext, letterID string, participantID string) error {
	letter, err := ctx.GetLetterOfCredit(letterID)

	if err != nil {
		return err
	}

	banker, err := ctx.GetBankEmployee(participantID)

	if err != nil {
		return err
	}

	if !letter.IsExportingBank(*banker) {
		return errors.New("Participant passed is not exporting bank")
	} else if letter.GetStatus() < defs.ReadyForPayment {
		return errors.New("The letter of credit is not yet marked as ready for payment. Cannot close")
	} else if letter.GetStatus() >= defs.Closed {
		return errors.New("The letter of credit is already marked as closed")
	}

	letter.SetStatus(defs.Closed)

	return ctx.PutLetterOfCredit(letter)
}

// ========== USEFUL NON EXPORTED HELPERS ==========

func (loc *LetterOfCredit) parseRules(rulesJSON string) ([]defs.Rule, error) {
	rules := []defs.Rule{}
	err := json.Unmarshal([]byte(rulesJSON), &rules)

	if err != nil {
		return nil, fmt.Errorf("Could not convert passed JSON %s into slice of rules", rulesJSON)
	}

	return rules, nil
}

func (loc *LetterOfCredit) getEditableLetterOfCredit(ctx *helpers.TransactionContext, letterID string) (*defs.LetterOfCredit, error) {
	letter, err := ctx.GetLetterOfCredit(letterID)

	if err != nil {
		return nil, err
	}

	if letter.GetStatus() > defs.AwaitingApproval {
		return nil, errors.New("The letter of credit is no longer editable")
	} else if letter.FullyApproved() {
		return nil, errors.New("The letter of credit has already been approved")
	}

	return letter, nil
}

func (loc *LetterOfCredit) getParticipantByRole(ctx *helpers.TransactionContext, role string, participantID string) (interface{}, error) {
	switch strings.ToLower(role) {
	case "applicant":
		fallthrough
	case "beneficiary":
		participant, err := ctx.GetCustomer(participantID)
		return *participant, err
	case "issuingbank":
		fallthrough
	case "exportingbank":
		participant, err := ctx.GetBankEmployee(participantID)
		return *participant, err
	default:
		return nil, fmt.Errorf("%s not a valid approval field", role)
	}
}
