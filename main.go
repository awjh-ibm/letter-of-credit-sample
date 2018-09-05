package main

import (
	"businesslogic"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/contractapi"
)

func main() {
	locc := new(businesslogic.LetterOfCredit)
	locc.SetNamespace("letterofcredit")

	pc := new(businesslogic.Participants)
	pc.SetNamespace("participants")

	if err := contractapi.CreateNewChaincode(locc, pc); err != nil {
		fmt.Printf("Error starting LettersOfCredit chaincode: %s", err)
	}
}
