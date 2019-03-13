'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

// Bring key classes into scope, most importantly Fabric SDK network class
import * as Client from 'fabric-client';
import { Contract, FileSystemWallet, Gateway, Network } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import { FabricConfig } from './interfaces/config';

export default class FabricProxy {

    public wallet: FileSystemWallet;
    public config: FabricConfig;

    private ccp: any;

    constructor(config: FabricConfig) {
        const walletpath = path.resolve(process.cwd(), config.walletPath);

        this.wallet = new FileSystemWallet(walletpath);
        this.config = config;

        const ccpPath = path.resolve(process.cwd(), config.connectionProfilePath);
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        this.ccp = JSON.parse(ccpJSON);
    }

    public async evaluateTransaction(user: string, functionName: string, ...args: string[]): Promise<Buffer> {
        return this.handleTransaction('evaluateTransaction', user, functionName, ...args);
    }

    public async submitTransaction(user: string, functionName: string, ...args: string[]): Promise<Buffer> {
        return this.handleTransaction('submitTransaction', user, functionName, ...args);
    }

    private async handleTransaction(type: 'evaluateTransaction'| 'submitTransaction', user: string, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            const gateway: Gateway = await this.setupGateway(user);
            const contract: Contract = await this.getContract(gateway);
            const buff: Buffer = await contract[type](`${functionName}`, ...args);
            
            gateway.disconnect();

            return buff;
        } catch (error) {
            throw error;
        }
    }

    private async getContract(gateway: Gateway): Promise<Contract> {
        try {
            const network: Network = await gateway.getNetwork(this.config.channelName);
            return await network.getContract(this.config.contractName);
        } catch (err) {
            throw new Error('Error connecting to channel. Does channel name exist? ERROR:' + err.message);
        }
    }

    private async setupGateway(user: string): Promise<Gateway> {
        try {
            const gateway = new Gateway();
            // Set connection options; use 'admin' identity from application wallet
            const connectionOptions = {
                discovery: { asLocalhost: true},
                identity: user,
                wallet: this.wallet,
            };

            // Connect to gateway using application specified parameters
            await gateway.connect(this.ccp, connectionOptions);
            return gateway;
        } catch (error) {
            throw error;
        }
    }
}
