package main

import (
	"businesslogic"
	"fmt"
	"helpers"

	"github.com/hyperledger/fabric/core/chaincode/contractapi"
)

func main() {
	locc := new(businesslogic.LetterOfCredit)
	locc.SetNamespace("org.example.letterofcredit")
	locc.SetTransactionContextHandler(new(helpers.TransactionContext))

	pc := new(businesslogic.Participants)
	pc.SetNamespace("org.system.participants")
	pc.SetTransactionContextHandler(new(helpers.TransactionContext))

	if err := contractapi.CreateNewChaincode(locc, pc); err != nil {
		fmt.Printf("Error starting LettersOfCredit chaincode: %s", err)
	}
}
