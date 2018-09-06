cd letters_of_credit
go build
CORE_PEER_ADDRESS=peer:7052 CORE_CHAINCODE_ID_NAME=mycc:0 ./letters_of_credit

peer chaincode install -p chaincodedev/chaincode/letters_of_credit -n mycc -v 0

peer chaincode instantiate -n mycc -c '{"Args":["org.system.participants.CreateBank", "bod", "bank of dinero"]}' -C myc -v 0
peer chaincode invoke -n mycc -c '{"Args":["org.system.participants.CreateBank", "eb", "eastwood banking"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.system.participants.CreateBankEmployee", "mathias", "mathias", "bianchi", "bod"]}' -C myc
peer chaincode invoke -n mycc -c '{"Args":["org.system.participants.CreateBankEmployee", "ella", "ella", "wilson", "eb"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.system.participants.CreateCustomer", "alice", "alice", "hamilton", "bod"]}' -C myc
peer chaincode invoke -n mycc -c '{"Args":["org.system.participants.CreateCustomer", "bob", "bob", "appleton", "eb"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.Apply", "LETTER1", "alice", "bob", "[{\"name\": \"timeLimit\", \"wording\": \"delivery in 30 days\"}]", "{\"productType\": \"computers\", \"quantity\": 100, \"unitPrice\": 150}"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.SuggestRuleChange", "LETTER1", "[{\"name\": \"timeLimit\", \"wording\": \"delivery in 45 days\"}]", "issuingBank", "mathias"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.Approve", "LETTER1", "applicant", "alice"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.Approve", "LETTER1", "exportingBank", "ella"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.Approve", "LETTER1", "beneficiary", "bob"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.MarkAsShipped", "LETTER1", "bob", "{\"name\": \"billOfLading\", \"hash\": \"3D0B76BB23B1568EC4785CA318C76106484A9A1D14E876DD5E1E6EEAE2F28CF2\"}"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.MarkAsReceived", "LETTER1", "alice"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.MarkAsReadyForPayment", "LETTER1", "mathias"]}' -C myc

peer chaincode invoke -n mycc -c '{"Args":["org.example.letterofcredit.Close", "LETTER1", "ella"]}' -C myc

peer chaincode query -n mycc -c '{"Args":["org.example.letterofcredit.Get", "LETTER1", "applicant", "alice"]}' -C myc