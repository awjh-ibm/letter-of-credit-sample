import { Bank, Person } from '../participant-defs/participants';
import { CUSTOMER, BANK_EMPLOYEE } from '../utils/clientidentity';
import { Contract } from 'fabric-contract-api';
import { LOCNetContext } from '../utils/context';

export class ParticipantsContract extends Contract {
    constructor() {
        super('org.locnet.participants');
    }

    public createContext() {
        return new LOCNetContext();
    }

    public async registerBank(ctx: LOCNetContext, bankName: string) {
        const bank: Bank = await ctx.getClientIdentity().newBankFromCaller(bankName);

        await ctx.getParticipantList().addBank(bank);
    }

    public async registerParticipant(ctx: LOCNetContext) {
        const ci = ctx.getClientIdentity();

        if (ci.desiredCallerRole(CUSTOMER)) {
            await ctx.getParticipantList().addCustomer(await ci.toCustomer(false))
        } else if (ci.desiredCallerRole(BANK_EMPLOYEE)) {
            await ctx.getParticipantList().addBankEmployee(await ci.toBankEmployee(false))
        } else {
            throw new Error('Failed to register participant. Invalid client identity with role ' + ci.getRole())
        }
    }
}