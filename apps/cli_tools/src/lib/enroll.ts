import * as path from 'path';
import * as fs from 'fs';

import { FileSystemWallet, Gateway, X509WalletMixin } from 'fabric-network';
import { User } from 'fabric-client';
import { IKeyValueAttribute } from 'fabric-ca-client';
import { orgName } from './constants';

interface LocUser {
    name: string;
    org: string;
    attrs: Array<IKeyValueAttribute>
}

const adminSuffix = 'org1.example.com';
const users: Array<LocUser> = [{
    "name": "alice",
    "org": orgName,
    "attrs": [
        {"name": "locnet.role", "value": "customer", "ecert": true},
        {"name": "forename", "value": "alice", "ecert": true},
        {"name": "surname", "value": "hamilton", "ecert": true},
        {"name": "company", "value": "alice the importer", "ecert": true}
    ]
},{
    "name": "bob",
    "org": orgName,
    "attrs": [
        {"name": "locnet.role", "value": "customer", "ecert": true},
        {"name": "forename", "value": "bob", "ecert": true},
        {"name": "surname", "value": "appleton", "ecert": true},
        {"name": "company", "value": "bob the exporter", "ecert": true}
    ]
},{
    "name": "mathias",
    "org": orgName,
    "attrs": [
        {"name": "locnet.role", "value": "bankemployee", "ecert": true},
        {"name": "forename", "value": "mathias", "ecert": true},
        {"name": "surname", "value": "gonzalez", "ecert": true}
    ]
},{
    "name": "ella",
    "org": orgName,
    "attrs": [
        {"name": "locnet.role", "value": "bankemployee", "ecert": true},
        {"name": "forename", "value": "ella", "ecert": true},
        {"name": "surname", "value": "deschamps", "ecert": true}
    ]
}]

export class Enroll {
    public static async enrollUsers(local_fabric: string) {

        const ccpPath = path.resolve(process.cwd(), local_fabric, 'connection.json');
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        const {admin, ca} = await this.connectAsAdmin(local_fabric, ccp)

        for (let user of users) {
            await this.enrollUser(local_fabric, user, admin, ca, ccp);
        }
    }

    private static async connectAsAdmin(local_fabric: string, ccp: object): Promise<{admin: User, ca: any}> {
        const admwalletPath = path.join(process.cwd(), local_fabric, 'wallet');

        const wallet = new FileSystemWallet(admwalletPath);

        const adminExists = await wallet.exists(`Admin@${adminSuffix}`);

        if (!adminExists) {
        	throw new Error('Failed to setup admin. Have you enrolled them?');
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: `Admin@${adminSuffix}`, discovery: { enabled: false ,  asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();

        const adminIdentity = gateway.getCurrentIdentity();

        return {admin: adminIdentity, ca};
    }

    private static async enrollUser(local_fabric: string, user: LocUser, admin: User, ca: any, ccp: any): Promise<void> {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), local_fabric, 'wallet', user.org);
        const wallet = new FileSystemWallet(walletPath);


        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user.name);
        if (userExists) {
            throw new Error('An identity for the user ' + user.name + ' already exists in the wallet');
        }

        const attrs = user.attrs;
        attrs.push({name: 'locnet.username', value: user.name + '@' + orgName, ecert: true})

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: user.name, role: 'client', attrs: attrs }, admin);

        const enrollment = await ca.enroll({ enrollmentID: user.name, enrollmentSecret: secret });

        const userIdentity = X509WalletMixin.createIdentity(ccp.organizations[user.org].mspid, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(user.name, userIdentity);
    }
}