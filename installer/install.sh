#!/bin/bash
BASEDIR=$(dirname "$0")

if [ $BASEDIR = '.' ]
then
    BASEDIR=$(pwd)
fi

DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose
CRYPTO_CONFIG=$BASEDIR/network/crypto-material/crypto-config

echo "################"
echo "# GENERATE CRYPTO"
echo "################"
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d

docker exec cli cryptogen generate --config=/etc/hyperledger/config/crypto-config.yaml --output /etc/hyperledger/config/crypto-config
docker exec cli configtxgen -profile TwoOrgsOrdererGenesis -outputBlock /etc/hyperledger/config/genesis.block
docker exec cli configtxgen -profile TwoOrgsChannel -outputCreateChannelTx /etc/hyperledger/config/channel.tx -channelID locnet
docker exec cli cp /etc/hyperledger/fabric/core.yaml /etc/hyperledger/config
docker exec cli sh /etc/hyperledger/config/rename_sk.sh

docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo "################"
echo "# SETUP NETWORK"
echo "################"
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.yaml -p node up -d

echo "################"
echo "# CHANNEL INIT"
echo "################"
docker exec bankofdinero_cli peer channel create -o orderer.example.com:7050 -c locnet -f /etc/hyperledger/configtx/channel.tx --outputBlock /etc/hyperledger/configtx/locnet.block
docker exec bankofdinero_cli peer channel join -b /etc/hyperledger/configtx/locnet.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
docker exec eastwoodbanking_cli peer channel join -b /etc/hyperledger/configtx/locnet.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem

echo "################"
echo "# CHAINCODE INSTALL"
echo "################"
docker exec bankofdinero_cli bash -c "apk add nodejs nodejs-npm python make g++"
docker exec bankofdinero_cli bash -c 'cd /opt/gopath/src/github.com/awjh-ibm/letter-of-credit-contract; npm install; npm run build'
docker exec bankofdinero_cli peer chaincode install -l node -n letters-of-credit-chaincode -v 0 -p /opt/gopath/src/github.com/awjh-ibm/letter-of-credit-contract
docker exec eastwoodbanking_cli peer chaincode install -l node -n letters-of-credit-chaincode -v 0 -p /opt/gopath/src/github.com/awjh-ibm/letter-of-credit-contract

echo "################"
echo "# CHAINCODE INSTANTIATE"
echo "################"
docker exec bankofdinero_cli peer chaincode instantiate -o orderer.example.com:7050 -l node -C locnet -n letters-of-credit-chaincode -v 0 -c '{"Args":[]}' -P 'AND ("BankOfDineroMSP.member", "EastwoodBankingMSP.member")'

echo "################"
echo "# BUILD CLI_TOOLS"
echo "################"
cd $BASEDIR/cli_tools
npm install
npm run build
cd $BASEDIR

echo "################"
echo "# SETUP WALLET"
echo "################"
LOCAL_FABRIC=$BASEDIR/locnet_fabric
BOD_CONNCETION=$LOCAL_FABRIC/bod_connection.json
EB_CONNECTION=$LOCAL_FABRIC/eb_connection.json

mkdir -p $LOCAL_FABRIC/wallet
sed -e 's/{{LOC_ORG_ID}}/BankOfDinero/g' $BASEDIR/network/connection.tmpl > $BOD_CONNCETION
sed -e 's/{{LOC_ORG_ID}}/EastwoodBanking/g' $BASEDIR/network/connection.tmpl > $EB_CONNECTION

echo "################"
echo "# ENROLLING ADMINS"
echo "################"

mkdir $BASEDIR/tmp

FABRIC_CA_CLIENT_HOME=/root/fabric-ca/clients/admin

docker exec ca0.example.com bash -c "FABRIC_CA_CLIENT_HOME=$FABRIC_CA_CLIENT_HOME fabric-ca-client enroll -u http://admin:adminpw@ca0.example.com:7054"
docker exec ca0.example.com bash -c "cd $FABRIC_CA_CLIENT_HOME/msp/keystore; find ./ -name '*_sk' -exec mv {} key.pem \;"
docker cp ca0.example.com:$FABRIC_CA_CLIENT_HOME/msp/signcerts/cert.pem $BASEDIR/tmp
docker cp ca0.example.com:$FABRIC_CA_CLIENT_HOME/msp/keystore/key.pem $BASEDIR/tmp

mv $BASEDIR/tmp/cert.pem $BASEDIR/tmp/bod_cert.pem
mv $BASEDIR/tmp/key.pem $BASEDIR/tmp/bod_key.pem

docker exec ca1.example.com bash -c "FABRIC_CA_CLIENT_HOME=$FABRIC_CA_CLIENT_HOME fabric-ca-client enroll -u http://admin:adminpw@ca1.example.com:7054"
docker exec ca1.example.com bash -c "cd $FABRIC_CA_CLIENT_HOME/msp/keystore; find ./ -name '*_sk' -exec mv {} key.pem \;"
docker cp ca1.example.com:$FABRIC_CA_CLIENT_HOME/msp/signcerts/cert.pem $BASEDIR/tmp
docker cp ca1.example.com:$FABRIC_CA_CLIENT_HOME/msp/keystore/key.pem $BASEDIR/tmp

mv $BASEDIR/tmp/cert.pem $BASEDIR/tmp/eb_cert.pem
mv $BASEDIR/tmp/key.pem $BASEDIR/tmp/eb_key.pem

echo "################"
echo "# ENROLLING LOCNET USERS"
echo "################"

BOD_ADMIN_CERT=$BASEDIR/tmp/bod_cert.pem
BOD_ADMIN_KEY=$BASEDIR/tmp/bod_key.pem

EB_ADMIN_CERT=$BASEDIR/tmp/eb_cert.pem
EB_ADMIN_KEY=$BASEDIR/tmp/eb_key.pem

BOD_USERS=$BASEDIR/users/bank-of-dinero.json
EB_USERS=$BASEDIR/users/eastwood-banking.json

node $BASEDIR/cli_tools/dist/index.js import -w $LOCAL_FABRIC/wallet -m BankOfDineroMSP -n Admin@bank-of-dinero.com -c $BOD_ADMIN_CERT -k $BOD_ADMIN_KEY
node $BASEDIR/cli_tools/dist/index.js import -w $LOCAL_FABRIC/wallet -m EastwoodBankingMSP -n Admin@eastwood-banking.com -c $EB_ADMIN_CERT -k $EB_ADMIN_KEY

node $BASEDIR/cli_tools/dist/index.js enroll -w $LOCAL_FABRIC/wallet -c $BOD_CONNCETION -u $BOD_USERS -a Admin@bank-of-dinero.com -o BankOfDinero
node $BASEDIR/cli_tools/dist/index.js enroll -w $LOCAL_FABRIC/wallet -c $EB_CONNECTION -u $EB_USERS -a Admin@eastwood-banking.com -o EastwoodBanking

echo "################"
echo "# STARTUP REST SERVERS"
echo "################"

REST_DIR=$BASEDIR/../apps/rest_server

cd $REST_DIR
npm install
npm run build
cd $BASEDIR

BOD_REST_PORT=3000
EB_REST_PORT=3001

# echo "node $REST_DIR/dist/cli.js --wallet $LOCAL_FABRIC/wallet/BankOfDinero --connection-profile $BOD_CONNCETION --port $BOD_REST_PORT > $BASEDIR/tmp/bod_server.log 2>&1 &"
node $REST_DIR/dist/cli.js --wallet $LOCAL_FABRIC/wallet/BankOfDinero --connection-profile $BOD_CONNCETION --port $BOD_REST_PORT > $BASEDIR/tmp/bod_server.log 2>&1 &

# echo "node $REST_DIR/dist/cli.js --wallet $LOCAL_FABRIC/wallet/EastwoodBanking --connection-profile $EB_CONNECTION --port $EB_REST_PORT > $BASEDIR/tmp/eb_server.log 2>&1 &"
node $REST_DIR/dist/cli.js --wallet $LOCAL_FABRIC/wallet/EastwoodBanking --connection-profile $EB_CONNECTION --port $EB_REST_PORT > $BASEDIR/tmp/eb_server.log 2>&1 &

printf 'WAITING FOR BANK OF DINERO REST SERVER'
until $(curl --output /dev/null --silent --head --fail http://localhost:$BOD_REST_PORT); do
    printf '.'
    sleep 2
done

echo ""
printf 'WAITING FOR EASTWOOD BANKING REST SERVER'
until $(curl --output /dev/null --silent --head --fail http://localhost:$EB_REST_PORT); do
    printf '.'
    sleep 2
done

echo ""
echo "################"
echo "# REGISTER EVERYONE IN CHAINCODE"
echo "################"
LETTER_OF_CREDIT_CONTRACT="org.locnet.letterofcredit"

curl -X POST -H "Content-Type: application/json" -d '{"bankName": "Bank of Dinero"}' -u system:systempw http://localhost:$BOD_REST_PORT/$LETTER_OF_CREDIT_CONTRACT/registerBank

for row in $(jq -r ".[] | .name" $BOD_USERS); do
    if [ $row != "system" ]; then
        echo "REGISTERING $row"
        curl -X POST -H "Content-Type: application/json" -d '{}' -u $row:${row}pw http://localhost:$BOD_REST_PORT/$LETTER_OF_CREDIT_CONTRACT/registerParticipant
    fi
done

curl -X POST -H "Content-Type: application/json" -d '{"bankName": "Eastwood Banking"}' -u system:systempw http://localhost:$EB_REST_PORT/$LETTER_OF_CREDIT_CONTRACT/registerBank

for row in $(jq -r ".[] | .name" $EB_USERS); do
    if [ $row != "system" ]; then
        echo "REGISTERING $row"
        curl -X POST -H "Content-Type: application/json" -d '{}' -u $row:${row}pw http://localhost:$EB_REST_PORT/$LETTER_OF_CREDIT_CONTRACT/registerParticipant
    fi
done