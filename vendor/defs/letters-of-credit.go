package defs

import (
	"encoding/json"
	"fmt"
	"strings"
)

type approval struct {
	Applicant     bool `json:"applicant"`
	Beneficiary   bool `json:"beneficiary"`
	IssuingBank   bool `json:"issuingBank"`
	ExportingBank bool `json:"exportingBank"`
}

// Rule - A rule that for a letter of credit to abide by
type Rule struct {
	Name    string `json:"name"`
	Wording string `json:"wording"`
}

// ProductDetails - details of the product a letter of credit refers to
type ProductDetails struct {
	ProductType string  `json:"productType"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unitPrice"`
}

// Evidence - hashes of information useful for process
type Evidence struct {
	Name string `json:"name"`
	Hash string `json:"hash"`
}

// LetterStatus - Statuses a letter can have
type LetterStatus int

// Letter status types
const (
	AwaitingApproval LetterStatus = 0 + iota
	Approved
	Shipped
	Received
	ReadyForPayment
	Closed
	Rejected
)

// GetString - get the string value for enum
func (ls LetterStatus) GetString() string {
	switch ls {
	case AwaitingApproval:
		return "AWAITING_APPROVAL"
	case Approved:
		return "APPROVED"
	case Shipped:
		return "SHIPPED"
	case Received:
		return "RECEIVED"
	case ReadyForPayment:
		return "READY_FOR_PAYMENT"
	case Closed:
		return "CLOSED"
	case Rejected:
		return "REJECTED"
	default:
		return "UNKNOWN"
	}
}

// GetLetterStatus - get letter status from string
func GetLetterStatus(value string) LetterStatus {
	switch value {
	case "AWAITING_APPROVAL":
		return AwaitingApproval
	case "APPROVED":
		return Approved
	case "SHIPPED":
		return Shipped
	case "RECEIVED":
		return Received
	case "READY_FOR_PAYMENT":
		return ReadyForPayment
	case "CLOSED":
		return Closed
	case "REJECTED":
		return Rejected
	default:
		return -1
	}
}

// LetterOfCredit - Provides rules for the management
type LetterOfCredit struct {
	id             string
	applicant      Customer
	beneficiary    Customer
	issuingBank    Bank
	exportingBank  Bank
	rules          []Rule
	productDetails ProductDetails
	evidence       []Evidence
	approval       approval
	status         LetterStatus
}

// NewLetterOfCredit - Create a new letter of credit
func NewLetterOfCredit(id string, applicant Customer, beneficiary Customer, issuingBank Bank, exportingBank Bank, rules []Rule, productDetails ProductDetails) *LetterOfCredit {
	loc := new(LetterOfCredit)
	loc.id = id
	loc.applicant = applicant
	loc.beneficiary = beneficiary
	loc.issuingBank = issuingBank
	loc.exportingBank = exportingBank
	loc.rules = rules
	loc.productDetails = productDetails
	loc.evidence = []Evidence{}
	loc.approval = approval{true, false, false, false}
	loc.status = AwaitingApproval

	return loc
}

// AddApproval - sets approval for field to true
func (loc *LetterOfCredit) AddApproval(field string) {
	switch strings.ToLower(field) {
	case "applicant":
		loc.AddApplicantApproval()
	case "beneficiary":
		loc.AddBeneficiaryApproval()
	case "issuingbank":
		loc.AddIssuingBankApproval()
	case "exportingbank":
		loc.AddExportingBankApproval()
	}
}

// ClearApproval - Set all approval to false
func (loc *LetterOfCredit) ClearApproval() {
	loc.approval = approval{false, false, false, false}
}

// AddApplicantApproval - sets applicant approval to true
func (loc *LetterOfCredit) AddApplicantApproval() {
	loc.approval.Applicant = true
}

// AddBeneficiaryApproval - sets beneficiary approval to true
func (loc *LetterOfCredit) AddBeneficiaryApproval() {
	loc.approval.Beneficiary = true
}

// AddIssuingBankApproval - sets issuingBank approval to true
func (loc *LetterOfCredit) AddIssuingBankApproval() {
	loc.approval.IssuingBank = true
}

// AddExportingBankApproval - sets exportingBank approval to true
func (loc *LetterOfCredit) AddExportingBankApproval() {
	loc.approval.ExportingBank = true
}

// FullyApproved - returns true when all parties have added their approval
func (loc *LetterOfCredit) FullyApproved() bool {
	return loc.approval.Applicant && loc.approval.Beneficiary && loc.approval.IssuingBank && loc.approval.ExportingBank
}

// IsApplicant - returns true if person passed is the applicant
func (loc *LetterOfCredit) IsApplicant(person interface{}) bool {
	if customer, ok := person.(Customer); ok {
		return loc.applicant == customer
	}

	return false
}

// IsBeneficiary - returns true if person passed is the beneficiary
func (loc *LetterOfCredit) IsBeneficiary(person interface{}) bool {
	if customer, ok := person.(Customer); ok {
		return loc.beneficiary == customer
	}
	return false
}

// IsIssuingBank - returns true if person passed is a banker whose bank is the issuing bank
func (loc *LetterOfCredit) IsIssuingBank(person interface{}) bool {
	if banker, ok := person.(BankEmployee); ok {
		return loc.issuingBank == banker.Bank
	}
	return false
}

// IsExportingBank - returns true if person passed is a banker whose bank is the exporting bank
func (loc *LetterOfCredit) IsExportingBank(person interface{}) bool {
	if banker, ok := person.(BankEmployee); ok {
		return loc.exportingBank == banker.Bank
	}
	return false
}

// IsParty - returns true if person is a party in the letter of credit
func (loc *LetterOfCredit) IsParty(person interface{}) bool {
	return (loc.IsApplicant(person) || loc.IsBeneficiary(person) || loc.IsIssuingBank(person) || loc.IsExportingBank(person))
}

// IsSpecificParty - returns true if the person passed is a party for the field passed
func (loc *LetterOfCredit) IsSpecificParty(person interface{}, field string) bool {
	switch strings.ToLower(field) {
	case "applicant":
		return loc.IsApplicant(person)
	case "beneficiary":
		return loc.IsBeneficiary(person)
	case "issuingbank":
		return loc.IsIssuingBank(person)
	case "exportingbank":
		return loc.IsExportingBank(person)
	}
	return false
}

// GetID - Get the letter of credit's ID
func (loc *LetterOfCredit) GetID() string {
	return loc.id
}

// GetStatus - Get the letter of credit's status
func (loc *LetterOfCredit) GetStatus() LetterStatus {
	return loc.status
}

// SetStatus - set the status to a letter status value
func (loc *LetterOfCredit) SetStatus(status LetterStatus) error {
	if status.GetString() != "UNKNOWN" {
		loc.status = status
	}
	return fmt.Errorf("%d is not a valid status", status)
}

// SetRules - set the rules of letter
func (loc *LetterOfCredit) SetRules(rules []Rule) {
	loc.rules = rules
}

// AddEvidence - add to slice of evidence
func (loc *LetterOfCredit) AddEvidence(evidence Evidence) {
	loc.evidence = append(loc.evidence, evidence)
}

// ========== CUSTOM JSON MARSHALLING ==========

type jsonLetterOfCredit struct {
	ID             string         `json:"id"`
	Applicant      Customer       `json:"applicant"`
	Beneficiary    Customer       `json:"beneficiary"`
	IssuingBank    Bank           `json:"issuingBank"`
	ExportingBank  Bank           `json:"exportingBank"`
	Rules          []Rule         `json:"rules"`
	ProductDetails ProductDetails `json:"productDetails"`
	Evidence       []Evidence     `json:"evidence"`
	Approval       approval       `json:"approval"`
	Status         string         `json:"status"`
}

// MarshalJSON - get an LOC as JSON
func (loc *LetterOfCredit) MarshalJSON() ([]byte, error) {
	jloc := jsonLetterOfCredit{
		loc.id,
		loc.applicant,
		loc.beneficiary,
		loc.issuingBank,
		loc.exportingBank,
		loc.rules,
		loc.productDetails,
		loc.evidence,
		loc.approval,
		loc.status.GetString(),
	}

	return json.Marshal(jloc)
}

// UnmarshalJSON - get LOC from JSON
func (loc *LetterOfCredit) UnmarshalJSON(data []byte) error {

	jloc := new(jsonLetterOfCredit)

	err := json.Unmarshal(data, jloc)

	if err != nil {
		return err
	}

	loc.id = jloc.ID
	loc.applicant = jloc.Applicant
	loc.beneficiary = jloc.Beneficiary
	loc.issuingBank = jloc.IssuingBank
	loc.exportingBank = jloc.ExportingBank
	loc.rules = jloc.Rules
	loc.productDetails = jloc.ProductDetails
	loc.evidence = jloc.Evidence
	loc.approval = jloc.Approval
	loc.status = GetLetterStatus(jloc.Status)

	return nil
}
