/*
SPDX-License-Identifier: Apache-2.0
*/

import { LetterOfCreditContext } from "./context";
import { ClientIdentity } from "fabric-shim";
import { Person, Customer, BankEmployee, Bank } from "../participant-defs/participants";

export type Role = 'customer' | 'bankemployee';

export const CUSTOMER = 'customer';
export const BANK_EMPLOYEE = 'bankemployee';
export const SYSTEM = 'system';
const ROLE_FIELD = 'locnet.role';
const USERNAME_FIELD = 'locnet.username';

export class LetterOfCreditClientIdentity extends ClientIdentity {
    private ctx: LetterOfCreditContext

    constructor(ctx: LetterOfCreditContext) {
        super(ctx.stub);

        this.ctx = ctx;
    }

    public getRole(): string {
        return this.getAttributeValue(ROLE_FIELD);
    }

    public desiredCallerRole(desired: Role): boolean {
        return this.getAttributeValue(ROLE_FIELD) === desired;
    }

    public async toPerson(registered: boolean = true): Promise<Person> {
        switch (this.getAttributeValue(ROLE_FIELD)) {
            case BANK_EMPLOYEE: {
                return await this.toBankEmployee(registered);
            }
            case CUSTOMER: {
                return await this.toCustomer(registered);
            }
            default: {
                throw new Error('Failed to get Person. Invalid client identity with role ' + this.getAttributeValue(ROLE_FIELD))
            }
        }
    }

    public async toCustomer(registered: boolean = true): Promise<Customer> {
        if (this.getAttributeValue(ROLE_FIELD) !== CUSTOMER) {
            throw new Error('Failed to get client identity as Customer. Invalid client identity with role ' + this.getAttributeValue(ROLE_FIELD))
        }

        let customer: Customer;

        if (registered) {
            try {
                customer = await this.ctx.getParticipantList().getCustomer(this.getAttributeValue(USERNAME_FIELD));
            } catch(err) {
                throw new Error('Failed to get client identity as Customer. No Customer has been registered for user ' + this.getAttributeValue(USERNAME_FIELD));
            }
        } else {
            const bank: Bank = await this.getBankForCaller();

            customer = new Customer(this.getAttributeValue(USERNAME_FIELD), this.getAttributeValue('forename'), this.getAttributeValue('surname'), bank, this.getAttributeValue('company'))
        }
        
        return customer;
    }

    public async toBankEmployee(registered: boolean = true): Promise<BankEmployee> {
        if (this.getAttributeValue(ROLE_FIELD) !== BANK_EMPLOYEE) {
            throw new Error('Failed to get client identity as BankEmployee. Invalid client identity with role ' + this.getAttributeValue(ROLE_FIELD))
        }

        let bankEmployee: BankEmployee;

        if (registered) {
            try {
                bankEmployee = await this.ctx.getParticipantList().getBankEmployee(this.getAttributeValue(USERNAME_FIELD));
            } catch (err) {
                throw new Error('Failed to get client identity as BankEmployee. No BankEmployee has been registered for ID ' + this.getAttributeValue(USERNAME_FIELD));
            }
        } else {
            const bank: Bank = await this.getBankForCaller();

            bankEmployee = new BankEmployee(this.getAttributeValue(USERNAME_FIELD), this.getAttributeValue('forename'), this.getAttributeValue('surname'), bank);
        }

        return bankEmployee;
    }

    public async newBankFromCaller(name: string): Promise<Bank> {
        if (this.getAttributeValue(ROLE_FIELD) !== SYSTEM) {
            throw new Error('Failed to create Bank. Invalid client identity with role ' + this.getAttributeValue(ROLE_FIELD));
        }

        return new Bank(this.getMSPID().replace('MSP', ''), name);
    }

    public async getBankForCaller(): Promise<Bank> {
        const bankID = this.getMSPID().replace('MSP', '')
        
        let bank: Bank;

        try {
            bank = await this.ctx.getParticipantList().getBank(bankID); // will error if bank doesn't exist
        } catch (err) {
            throw new Error('Failed to get Bank for client identity. No Bank has been registered with ID ' + bankID);
        }

        return bank;
    }
}