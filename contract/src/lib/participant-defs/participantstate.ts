/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

import { State, IState } from "../ledger-api/state";

export const CUSTOMER_CLASS = 'org.locnet.customer';
export const BANK_EMPLOYEE_CLASS = 'org.locnet.bankemployee';
export const BANK_CLASS = 'org.locnet.bank';

export class BankState extends State implements IState {
    private id: string;
    private name: string;

    constructor (id: string, name: string) {
        super(BANK_CLASS, [id]);

        this.id = id;
        this.name = name;
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public static getClass(): string {
        return BANK_CLASS;
    }
}

export class PersonState extends State {
    private id: string;
    private forename: string;
    private surname: string;

    protected bankId: string;

    constructor (id: string, forename: string, surname: string, bankId: string, personClass: string) {
        super(personClass, [id]);
        
        this.id = id;
        this.forename = forename;
        this.surname = surname;
        this.bankId = bankId;
    }

    public getId(): string {
        return this.id;
    }

    public getForename(): string {
        return this.forename;
    }

    public getSurname(): string {
        return this.surname;
    }

    public getBankId() {
        return this.bankId;
    }
}

export class CustomerState extends PersonState implements IState {
    private company: string;

    constructor (id: string, forename: string, surname: string, bankId: string, company: string) {
        super(id, forename, surname, bankId, CUSTOMER_CLASS);

        this.company = company;
    }

    public getCompany(): string {
        return this.company;
    }

    public static getClass() {
        return CUSTOMER_CLASS;
    }
}

export class BankEmployeeState extends PersonState implements IState {
    constructor (id: string, forename: string, surname: string, bankId: string) {
        super(id, forename, surname, bankId, BANK_EMPLOYEE_CLASS);
    }

    public static getClass() {
        return BANK_EMPLOYEE_CLASS;
    }
}