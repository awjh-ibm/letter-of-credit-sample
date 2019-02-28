'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

// Bring key classes into scope, most importantly Fabric SDK network class
import * as Client from 'fabric-client';
import { Contract, FileSystemWallet, Gateway } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import FabricConfig from './fabricproxy.config';

interface ChannelInfo {
    channel: Client.Channel;
    contracts: Map<string, Contract>;
}

export default class FabricProxy {

    public wallet: FileSystemWallet;
    public identitylabel: string;
    public config: FabricConfig;

    private ccp: any;
    private gateway: Gateway;
    private peer: Client.Peer;
    private channels: Map<string, ChannelInfo>;

    constructor(config: FabricConfig) {
        const walletpath = path.join(process.cwd(), config.fabricpath, 'wallet', config.user.org);

        this.identitylabel = config.user.name;
        this.wallet = new FileSystemWallet(walletpath);
        this.config = config;

        const ccpPath = path.resolve(process.cwd(), config.fabricpath, 'connection.json');
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        this.ccp = JSON.parse(ccpJSON);

        this.channels = new Map();
    }

    public async setup() {
        this.gateway = new Gateway();

        await this.gatewayConnect();
        await this.getPeer();
        await this.getContracts();
    }

    public getChannelContracts(name: string): string[] {
        if (this.channels.get(name) === undefined) {
            throw new Error(`Channel with name ${name} does not exist`);
        }
        return Array.from(this.channels.get(name).contracts.keys());
    }

    public async evaluateTransaction(channelName: string, contractName: string, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            const contract = this.getContract(channelName, contractName);

            return await this._evaluateTransaction(contract, functionName, ...args);
        } catch (error) {
            throw error;
        }
    }

    public async submitTransaction(channelName: string, contractName: string, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            const contract = this.getContract(channelName, contractName);

            return await this._submitTransaction(contract, functionName, ...args);
        } catch (error) {
            throw error;
        }
    }

    private async _submitTransaction(contract: Contract, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            // evaluateTransactions
            return await contract.submitTransaction(`${functionName}`, ...args);

        } catch (error) {
            throw error;
        }
    }

    private async _evaluateTransaction(contract: Contract, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            // evaluateTransactions
            return await contract.evaluateTransaction(`${functionName}`, ...args);

        } catch (error) {
            throw error;
        }
    }

    private async getContracts() {
        try {
            const channelResponse: Client.ChannelQueryResponse = await this.gateway.getClient().queryChannels(this.peer);
            for (const channelInfo of channelResponse.channels) {
                const channel: Client.Channel = this.gateway.getClient().getChannel(channelInfo.channel_id);

                const chaincodeResponse: Client.ChaincodeQueryResponse = await channel.queryInstantiatedChaincodes(this.peer);

                const chaincodes = new Map();

                const network = await this.gateway.getNetwork(channelInfo.channel_id);

                for (const chaincodeInfo of chaincodeResponse.chaincodes) {
                    chaincodes.set(chaincodeInfo.name, await network.getContract(chaincodeInfo.name));
                }

                this.channels.set(channelInfo.channel_id, {
                    channel,
                    contracts: chaincodes,
                } as ChannelInfo);
            }
        } catch (error) {
            throw error;
        }
    }

    private getContract(channelName: string, contractName: string): Contract {
        if (this.channels.get(channelName) === undefined) {
            throw new Error(`Channel with name ${channelName} does not exist`);
        }

        const contract = this.channels.get(channelName).contracts.get(contractName);

        if (contract === undefined) {
            throw new Error(`Contract with name ${contractName} does not exist for channel ${channelName}`);
        }

        return contract;
    }

    private async gatewayConnect() {

        try {
            // Set connection options; use 'admin' identity from application wallet
            const connectionOptions = {
                discovery: { asLocalhost: true},
                identity: this.identitylabel,
                wallet: this.wallet,
            };

            // Connect to gateway using application specified parameters
            await this.gateway.connect(this.ccp, connectionOptions);
        } catch (error) {
            throw error;
        }
    }

    private async getPeer() {

        if (!this.ccp.peers) {
            throw new Error('Peers must be defined in connection profile');
        } else {
            const peerNames = Object.keys(this.ccp.peers);

            if (peerNames.length === 0) {
                throw new Error('At least one peer must be specified in the connection profile');
            }

            this.peer = await this.gateway.getClient().getPeer(peerNames[0]);
        }
    }
}
