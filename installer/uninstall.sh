#!/bin/sh
BASEDIR=$(dirname "$0")

if [ $BASEDIR = '.' ]
then
    BASEDIR=$(pwd)
fi

DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose

################
# REMOVE NODE LEFTOVERS FROM CHAINCODE
################
docker exec bankofdinero_cli bash -c 'cd /opt/gopath/src/github.com/awjh-ibm/letter-of-credit-contract; rm -rf dist; rm -rf node_modules; rm -f package-lock.json'

################
# REMOVE DOCKER CONTAINERS
################
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.yaml -p node down --volumes
docker rm -f $(docker ps -a | grep "dev-peer0.bank-of-dinero" | awk '{print $1}')
docker rm -f $(docker ps -a | grep "dev-peer0.eastwood-banking" | awk '{print $1}')

################
# REMOVE DEPLOYED CHAINCODE
################
docker rmi $(docker images | grep "^dev-peer0.bank-of-dinero" | awk '{print $3}')
docker rmi $(docker images | grep "^dev-peer0.eastwood-banking" | awk '{print $3}')

################
# CLEANUP CRYPTO
################
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d
docker exec cli bash -c 'cd /etc/hyperledger/config; rm -rf crypto-config; rm -f channel.tx; rm -f core.yaml; rm -f genesis.block; rm -f locnet.block'
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

################
# CLEANUP CLI_TOOLS
################
rm -rf $BASEDIR/cli_tools/node_modules
rm -f $BASEDIR/cli_tools/package-lock.json
rm -rf $BASEDIR/cli_tools/dist

################
# CLEANUP WALLET
################
rm -rf $BASEDIR/tmp
rm -rf $BASEDIR/locnet_fabric

################
# CLEANUP REST SERVERS
################
BOD_REST_PORT=3000
EB_REST_PORT=3001

rm -rf $BASEDIR/../apps/rest_server/node_modules
rm -f $BASEDIR/../apps/rest_server/package-lock.json
rm -rf $BASEDIR/../apps/rest_server/dist

lsof -i :$BOD_REST_PORT | awk '{if(NR>1)print $2}' | xargs kill
lsof -i :$EB_REST_PORT | awk '{if(NR>1)print $2}' | xargs kill