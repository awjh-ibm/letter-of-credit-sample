/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

import { BankState, CustomerState, BankEmployeeState } from "./participantstate";

export interface Person {
    getClass(): string;
    getBank(): Bank;
    getBankId(): string;
    getId(): string;
    getForename(): string
    getSurname(): string
}

export class Bank extends BankState {
    constructor (id: string, name: string) {
        super(id, name);
    }
}

export class Customer extends CustomerState implements Person {
    private bank: Bank;

    constructor (id: string, forename: string, surname: string, bank: Bank, company: string) {
        super(id, forename, surname, null, company);

        this.bank = bank;

        delete this.bankId;
    }

    public getBank(): Bank {
        return this.bank;
    }

    public getBankId(): string {
        return this.bank.getId();
    }
}

export class BankEmployee extends BankEmployeeState implements Person {
    private bank: Bank;

    constructor (id: string, forename: string, surname: string, bank: Bank) {
        super(id, forename, surname, null);

        this.bank = bank;

        delete this.bankId;
    }

    public getBank(): Bank {
        return this.bank;
    }

    public getBankId(): string {
        return this.bank.getId();
    }
}