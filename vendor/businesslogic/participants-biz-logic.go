package businesslogic

import (
	"defs"
	"helpers"

	"github.com/hyperledger/fabric/core/chaincode/contractapi"
)

// Participants -  Contract for handling participant lifecycle
type Participants struct {
	contractapi.Contract
}

// CreateCustomer - Create a new customer in the world state
func (pc *Participants) CreateCustomer(ctx *contractapi.TransactionContext, id string, forename string, surname string, bankID string, companyName string) error {
	stub := helpers.NewStub(ctx.GetStub())

	bank, err := stub.GetBank(bankID)

	if err != nil {
		return err
	}

	customer := new(defs.Customer)
	customer.ID = id
	customer.Forename = forename
	customer.Surname = surname
	customer.Bank = *bank
	customer.CompanyName = companyName

	return stub.CreateCustomer(customer)
}

// CreateBankEmployee - Create a new bank employee in the world state
func (pc *Participants) CreateBankEmployee(ctx *contractapi.TransactionContext, id string, forename string, surname string, bankID string) error {
	stub := helpers.NewStub(ctx.GetStub())

	bank, err := stub.GetBank(bankID)

	if err != nil {
		return err
	}

	banker := new(defs.BankEmployee)
	banker.ID = id
	banker.Forename = forename
	banker.Surname = surname
	banker.Bank = *bank

	return stub.CreateBankEmployee(banker)
}

// CreateBank - Create a new bank in the world state
func (pc *Participants) CreateBank(ctx *contractapi.TransactionContext, id string, name string) error {
	stub := helpers.NewStub(ctx.GetStub())

	bank := new(defs.Bank)
	bank.ID = id
	bank.Name = name

	return stub.CreateBank(bank)
}
