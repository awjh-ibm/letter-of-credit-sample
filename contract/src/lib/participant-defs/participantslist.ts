/*
SPDX-License-Identifier: Apache-2.0
*/

import { StateList } from "../ledger-api/statelist";
import { Bank, BankEmployee, Customer } from "./participants";
import { BankState, BankEmployeeState, CustomerState } from "./participantstate";
import { LetterOfCreditContext } from "../utils/context";

class ParticipantConverter {
    public static async fromCustomerState(cs: CustomerState, ctx: LetterOfCreditContext): Promise<Customer> {
        const bank = await ctx.getParticipantList().getBank(cs.getBankId())

        return new Customer(cs.getId(), cs.getForename(), cs.getSurname(), bank, cs.getCompany());
    }

    public static toCustomerState(c: Customer): CustomerState {
        return new CustomerState(c.getId(), c.getForename(), c.getSurname(), c.getBankId(), c.getCompany());
    }

    public static async fromBankEmployeeState(bes: BankEmployeeState, ctx: LetterOfCreditContext): Promise<BankEmployee> {
        const bank = await ctx.getParticipantList().getBank(bes.getBankId())

        return new BankEmployee(bes.getId(), bes.getForename(), bes.getSurname(), bank);
    }

    public static toBankEmployeeState(be: BankEmployee): BankEmployeeState {
        return new BankEmployeeState(be.getId(), be.getForename(), be.getSurname(), be.getBankId());
    }

    public static async fromBankState(bs: BankState, ctx: LetterOfCreditContext): Promise<Bank> {
        return new Bank(bs.getId(), bs.getName());
    }

    public static toBankState(b: Bank): BankState {
        return new BankState(b.getId(), b.getName());
    }
}

export class ParticipantList extends StateList {
    constructor (ctx: LetterOfCreditContext) {
        super(ctx, 'org.locnet.participantslist');
        this.use(BankState);
        this.use(BankEmployeeState);
        this.use(CustomerState);
    }

    async addBank(bank: Bank) {
        return this.addState(ParticipantConverter.toBankState(bank));
    }

    async getBank(bankId: string): Promise<Bank> {
        const rawBank = await this.getState(bankId) as BankState;

        return ParticipantConverter.fromBankState(rawBank, this.getCtx() as LetterOfCreditContext);
    }

    async addBankEmployee(bankEmployee: BankEmployee) {
        return this.addState(ParticipantConverter.toBankEmployeeState(bankEmployee));
    }

    async getBankEmployee(bankEmployeeId: string): Promise<BankEmployee> {
        const rawBankEmployee = await this.getState(bankEmployeeId) as BankEmployeeState;

        return ParticipantConverter.fromBankEmployeeState(rawBankEmployee, this.getCtx() as LetterOfCreditContext);
    }

    async addCustomer(customer: Customer) {
        return this.addState(ParticipantConverter.toCustomerState(customer));
    }

    async getCustomer(customerId: string): Promise<Customer> {
        const rawCustomer = await this.getState(customerId) as CustomerState;

        return ParticipantConverter.fromCustomerState(rawCustomer, this.getCtx() as LetterOfCreditContext);
    }
}