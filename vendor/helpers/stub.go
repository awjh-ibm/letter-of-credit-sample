package helpers

import (
	"defs"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/contractapi"
)

const stubCreateIDAlreadyExists = "There exists %s with ID %s in the world state"
const stubGetIDNotExist = "There exists no %s with ID %s in the world state"
const worldStateInteractionErr = "Unable to interact with world state"

// Prefixes for ids stored in world state
const (
	CustomerObjType     = "customer"
	BankEmployeeObjType = "bankemployee"
	BankObjType         = "bank"
	LocObjType          = "letterofcredit"
)

// TransactionContext - custom functions for accessing world state
type TransactionContext struct {
	contractapi.TransactionContext
}

// Create - add new value to world state
func (ctx *TransactionContext) Create(objectType string, id string, data []byte) error {
	_, err := ctx.Get(objectType, id)

	if err != nil {
		if err.Error() != fmt.Sprintf(stubGetIDNotExist, objectType, id) {
			if err.Error() != worldStateInteractionErr {
				err = fmt.Errorf(stubCreateIDAlreadyExists, objectType, id)
			}
			return err
		}
	}

	return ctx.Put(objectType, id, data)
}

// CreateJSON - add new json to world state
func (ctx *TransactionContext) CreateJSON(objectType string, id string, object interface{}) error {
	bytes, err := json.Marshal(object)

	if err != nil {
		return errors.New("Failed to generate JSON")
	}

	return ctx.Create(objectType, id, bytes)
}

// CreateCustomer - add new customer to the world state
func (ctx *TransactionContext) CreateCustomer(customer *defs.Customer) error {
	return ctx.CreateJSON(CustomerObjType, customer.ID, customer)
}

// CreateBankEmployee - add new bank employee to the world state
func (ctx *TransactionContext) CreateBankEmployee(banker *defs.BankEmployee) error {
	return ctx.CreateJSON(BankEmployeeObjType, banker.ID, banker)
}

// CreateBank - add new bank to the world state
func (ctx *TransactionContext) CreateBank(bank *defs.Bank) error {
	return ctx.CreateJSON(BankObjType, bank.ID, bank)
}

// CreateLetterOfCredit - add new letter of credit to the world state
func (ctx *TransactionContext) CreateLetterOfCredit(loc *defs.LetterOfCredit) error {
	return ctx.CreateJSON(LocObjType, loc.GetID(), loc)
}

// Get - get bytes from world state
func (ctx *TransactionContext) Get(objectType string, id string) ([]byte, error) {
	stub := ctx.GetStub()
	key, err := stub.CreateCompositeKey(objectType, []string{id})

	if err != nil {
		return nil, fmt.Errorf("Failed to generate world state key for %s with ID %s", objectType, id)
	}

	data, err := stub.GetState(key)

	if err != nil {
		return nil, errors.New(worldStateInteractionErr)
	}

	if data == nil {
		return nil, fmt.Errorf(stubGetIDNotExist, objectType, id)
	}

	return data, nil
}

// GetJSON - get JSON from the world state
func (ctx *TransactionContext) GetJSON(objectType string, id string, object interface{}) error {
	bytes, err := ctx.Get(objectType, id)

	if err != nil {
		return err
	}

	return json.Unmarshal(bytes, object)
}

// GetCustomer - get customer from the world state
func (ctx *TransactionContext) GetCustomer(id string) (*defs.Customer, error) {
	customer := new(defs.Customer)
	err := ctx.GetJSON(CustomerObjType, id, customer)

	if err != nil {
		return nil, err
	}

	return customer, nil
}

// GetBankEmployee - get bank employee from the world state
func (ctx *TransactionContext) GetBankEmployee(id string) (*defs.BankEmployee, error) {
	banker := new(defs.BankEmployee)
	err := ctx.GetJSON(BankEmployeeObjType, id, banker)

	if err != nil {
		return nil, err
	}

	return banker, nil
}

// GetBank - get bank from the world state
func (ctx *TransactionContext) GetBank(id string) (*defs.Bank, error) {
	bank := new(defs.Bank)
	err := ctx.GetJSON(BankObjType, id, bank)

	if err != nil {
		return nil, err
	}

	return bank, nil
}

// GetLetterOfCredit - get letter of credit from the world state
func (ctx *TransactionContext) GetLetterOfCredit(id string) (*defs.LetterOfCredit, error) {
	loc := new(defs.LetterOfCredit)
	err := ctx.GetJSON(LocObjType, id, loc)

	if err != nil {
		return nil, err
	}

	return loc, nil
}

// Put - update value in the world state
func (ctx *TransactionContext) Put(objectType string, id string, data []byte) error {
	stub := ctx.GetStub()
	key, err := stub.CreateCompositeKey(objectType, []string{id})

	if err != nil {
		return fmt.Errorf("Failed to generate world state key for %s with ID %s", objectType, id)
	}

	err = stub.PutState(key, data)

	if err != nil {
		return errors.New(worldStateInteractionErr)
	}

	return nil
}

// PutJSON - update JSON in the world state
func (ctx *TransactionContext) PutJSON(objectType string, id string, object interface{}) error {
	bytes, err := json.Marshal(object)

	if err != nil {
		return errors.New("Failed to generate JSON")
	}

	return ctx.Put(objectType, id, bytes)
}

// PutCustomer - update customer in the world state
func (ctx *TransactionContext) PutCustomer(customer *defs.Customer) error {
	return ctx.PutJSON(CustomerObjType, customer.ID, customer)
}

// PutBankEmployee - update bank employee in the world state
func (ctx *TransactionContext) PutBankEmployee(banker *defs.BankEmployee) error {
	return ctx.PutJSON(BankEmployeeObjType, banker.ID, banker)
}

// PutBank - update bank in the world state
func (ctx *TransactionContext) PutBank(bank *defs.Bank) error {
	return ctx.PutJSON(BankObjType, bank.ID, bank)
}

// PutLetterOfCredit - update letter of credit in the world state
func (ctx *TransactionContext) PutLetterOfCredit(loc *defs.LetterOfCredit) error {
	return ctx.PutJSON(LocObjType, loc.GetID(), loc)
}
