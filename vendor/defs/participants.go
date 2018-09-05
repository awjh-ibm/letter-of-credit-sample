package defs

import (
	"github.com/hyperledger/fabric/core/chaincode/contractapi"
)

type person struct {
	contractapi.Contract
	ID       string `json:"id"`
	Forename string `json:"forename"`
	Surname  string `json:"surname"`
	Bank     Bank   `json:"bank"`
}

// Customer - a member of the public who uses a bank
type Customer struct {
	person
	CompanyName string `json:"companyName"`
}

// BankEmployee - a staff member at a bank
type BankEmployee struct {
	person
}

// Bank - a banking corporation
type Bank struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
