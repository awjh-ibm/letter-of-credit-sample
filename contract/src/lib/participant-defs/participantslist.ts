/*
SPDX-License-Identifier: Apache-2.0
*/

import { StateList } from "../ledger-api/statelist";
import { Bank, BankEmployee, Customer } from "./participants";
import { BankState, BankEmployeeState, CustomerState } from "./participantstate";
import { LOCNetContext } from "../utils/context";

class ParticipantConverter {
    public static async fromCustomerState(cs: CustomerState, ctx: LOCNetContext): Promise<Customer> {
        const bank = await ctx.getParticipantList().getBank(cs.getBankId())

        return new Customer(cs.getId(), cs.getForename(), cs.getSurname(), bank, cs.getCompany());
    }

    public static toCustomerState(c: Customer): CustomerState {
        return new CustomerState(c.getId(), c.getForename(), c.getSurname(), c.getBankId(), c.getCompany());
    }

    public static async fromBankEmployeeState(bes: BankEmployeeState, ctx: LOCNetContext): Promise<BankEmployee> {
        const bank = await ctx.getParticipantList().getBank(bes.getBankId())

        return new BankEmployee(bes.getId(), bes.getForename(), bes.getSurname(), bank);
    }

    public static toBankEmployeeState(be: BankEmployee): BankEmployeeState {
        return new BankEmployeeState(be.getId(), be.getForename(), be.getSurname(), be.getBankId());
    }

    public static async fromBankState(bs: BankState, ctx: LOCNetContext): Promise<Bank> {
        return new Bank(bs.getId(), bs.getName());
    }

    public static toBankState(b: Bank): BankState {
        return new BankState(b.getId(), b.getName());
    }
}

export class ParticipantList extends StateList {
    constructor (ctx: LOCNetContext) {
        super(ctx, 'org.locnet.participantslist');
        this.use(BankState);
        this.use(BankEmployeeState);
        this.use(CustomerState);
    }

    async addBank(bank: Bank) {
        try {
            return this.addState(ParticipantConverter.toBankState(bank));
        } catch (err) {
            throw new Error('Failed to add bank. ERROR: ' + err.message);
        }
    }

    async getBank(bankId: string): Promise<Bank> {
        let rawBank;

        try {
            rawBank = await this.getState(bankId) as BankState;
        } catch (err) {
            throw new Error('Failed to get bank. ERROR: ' + err.message);
        }

        return ParticipantConverter.fromBankState(rawBank, this.getCtx() as LOCNetContext);
    }

    async addBankEmployee(bankEmployee: BankEmployee) {
        try {
            return this.addState(ParticipantConverter.toBankEmployeeState(bankEmployee));
        } catch (err) {
            throw new Error('Failed to add bank employee. ERROR: ' + err.message);
        }
    }

    async getBankEmployee(bankEmployeeId: string): Promise<BankEmployee> {
        let rawBankEmployee;

        try {
            rawBankEmployee = await this.getState(bankEmployeeId) as BankEmployeeState;
        } catch (err) {
            throw new Error('Failed to get bank employee. ERROR: ' + err.message);
        }

        return ParticipantConverter.fromBankEmployeeState(rawBankEmployee, this.getCtx() as LOCNetContext);
    }

    async addCustomer(customer: Customer) {
        try {
            return this.addState(ParticipantConverter.toCustomerState(customer));
        } catch (err) {
            throw new Error('Failed to add customer. ERROR: ' + err.message);
        }
    }

    async getCustomer(customerId: string): Promise<Customer> {
        let rawCustomer;

        try {
            rawCustomer = await this.getState(customerId) as CustomerState;
        } catch (err) {
            throw new Error('Failed to get customer. ERROR: ' + err.message);
        }

        return ParticipantConverter.fromCustomerState(rawCustomer, this.getCtx() as LOCNetContext);
    }
}