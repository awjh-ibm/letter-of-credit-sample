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
func (pc *Participants) CreateCustomer(ctx *helpers.TransactionContext, id string, forename string, surname string, bankID string, companyName string) error {
	bank, err := ctx.GetBank(bankID)

	if err != nil {
		return err
	}

	customer := new(defs.Customer)
	customer.ID = id
	customer.Forename = forename
	customer.Surname = surname
	customer.Bank = *bank
	customer.CompanyName = companyName

	return ctx.CreateCustomer(customer)
}

// CreateBankEmployee - Create a new bank employee in the world state
func (pc *Participants) CreateBankEmployee(ctx *helpers.TransactionContext, id string, forename string, surname string, bankID string) error {
	bank, err := ctx.GetBank(bankID)

	if err != nil {
		return err
	}

	banker := new(defs.BankEmployee)
	banker.ID = id
	banker.Forename = forename
	banker.Surname = surname
	banker.Bank = *bank

	return ctx.CreateBankEmployee(banker)
}

// CreateBank - Create a new bank in the world state
func (pc *Participants) CreateBank(ctx *helpers.TransactionContext, id string, name string) error {
	bank := new(defs.Bank)
	bank.ID = id
	bank.Name = name

	return ctx.CreateBank(bank)
}
