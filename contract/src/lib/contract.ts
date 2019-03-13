/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

import { Contract } from 'fabric-contract-api';

import { LetterOfCredit } from './letter-defs/letter';
import { LetterList } from './letter-defs/letterlist';
import { BankEmployee, Customer, Person, Bank } from './participant-defs/participants';
import { LetterOfCreditContext } from './utils/context';
import { CUSTOMER, BANK_EMPLOYEE } from './utils/clientidentity';
import { IApproval, IProductDetails, IRule, Status, IEvidence } from './letter-defs/letterstate';

export class LetterOfCreditContract extends Contract {
    constructor() {
        super('org.locnet.letterofcredit');
    }

    public createContext() {
        return new LetterOfCreditContext();
    }

    public async registerBank(ctx: LetterOfCreditContext, bankName: string) {
        const bank: Bank = await ctx.getClientIdentity().newBankFromCaller(bankName);

        await ctx.getParticipantList().addBank(bank);
    }

    public async registerParticipant(ctx: LetterOfCreditContext) {
        const ci = ctx.getClientIdentity();

        if (ci.desiredCallerRole(CUSTOMER)) {
            await ctx.getParticipantList().addCustomer(await ci.toCustomer(false))
        } else if (ci.desiredCallerRole(BANK_EMPLOYEE)) {
            await ctx.getParticipantList().addBankEmployee(await ci.toBankEmployee(false))
        } else {
            throw new Error('Failed to register participant. Invalid client identity with role ' + ci.getRole())
        }
    }

    public async get(ctx: LetterOfCreditContext, letterId: string): Promise<LetterOfCredit> {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letterList: LetterList = ctx.getLetterList();

        const letter: LetterOfCredit = await letterList.getLetter(letterId);

        if (!letter.isParty(person)) {
            throw new Error('Calling client identity is not a party in the letter of credit');
        }

        return letter;
    }

    public async getAll(ctx: LetterOfCreditContext): Promise<Array<LetterOfCredit>> {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letterList: LetterList = ctx.getLetterList();

        const letters: Map<string, LetterOfCredit> = await letterList.getAllLetters();

        const lettersArr: Array<LetterOfCredit> = [];

        letters.forEach((letter, letterId) => {
            if (letter.isParty(person)) {
                lettersArr.push(letter);
            }
        });

        return lettersArr;
    }

    public async apply(ctx: LetterOfCreditContext, letterId: string, beneficiaryId: string, rules: Array<IRule>, productDetails: IProductDetails) {
        const applicant: Customer = await ctx.getClientIdentity().toCustomer();
        const beneficiary: Customer = await ctx.getParticipantList().getCustomer(beneficiaryId);

        const approval: IApproval = {
            applicant: true,
            beneficiary: false,
            issuingBank: false,
            exportingBank: false
        };

        const letter: LetterOfCredit = new LetterOfCredit(letterId, applicant, beneficiary, rules, productDetails, [], approval, Status.AwaitingApproval);
    
        await ctx.getLetterList().addLetter(letter);
    }

    public async approve(ctx: LetterOfCreditContext, letterId: string) {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letter: LetterOfCredit = await this.getEditableLetterIfCredit(ctx, letterId);

        this.addApproval(person, letter);

        if (letter.fullyApproved()) {
            letter.setStatus(Status.Approved);
        }

        await ctx.getLetterList().updateLetter(letter);
    }

    public async reject(ctx: LetterOfCreditContext, letterId: string) {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letter: LetterOfCredit = await this.getEditableLetterIfCredit(ctx, letterId);

        if (!letter.isParty(person)) {
            throw new Error('Calling client identity is not a party in the letter of credit');
        }

        letter.clearApproval();
        letter.setStatus(Status.Rejected);

        await ctx.getLetterList().updateLetter(letter);
    }

    public async suggestRuleChange(ctx: LetterOfCreditContext, letterId: string, rules: Array<IRule>) {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letter: LetterOfCredit = await this.getEditableLetterIfCredit(ctx, letterId);

        if (!letter.isParty(person)) {
            throw new Error('Calling client identity is not a party in the letter of credit');
        }

        letter.setRules(rules);
        letter.clearApproval();
        this.addApproval(person, letter);
        
        await ctx.getLetterList().updateLetter(letter);
    }

    public async markAsShipped(ctx: LetterOfCreditContext, letterId: string, evidence: IEvidence) {
        const caller: Customer = await ctx.getClientIdentity().toCustomer();

        const letter: LetterOfCredit = await ctx.getLetterList().getLetter(letterId);

        if (!letter.isBeneficiary(caller)) {
            throw new Error('Calling client identity is not the beneficiary');
        } else if (letter.getStatus() === Status.AwaitingApproval) {
            throw new Error('The letter of credit is not approved. Cannot ship')
        } else if (letter.getStatus() >= Status.Shipped) {
            throw new Error('The letter of credit is already marked as having the products shipped or is closed')
        }

        letter.setStatus(Status.Shipped);
        letter.addEvidence(evidence);

        await ctx.getLetterList().updateLetter(letter);
    }

    public async markAsReceived(ctx: LetterOfCreditContext, letterId: string) {
        const caller: Customer = await ctx.getClientIdentity().toCustomer();

        const letter: LetterOfCredit = await ctx.getLetterList().getLetter(letterId);

        if (!letter.isApplicant(caller)) {
            throw new Error('Calling client identity is not the applicant');
        } else if (letter.getStatus() < Status.Shipped) {
            throw new Error('The letter of credit is not marked as having the products shipped. Cannot receive');
        } else if (letter.getStatus() >= Status.Received) {
            throw new Error('The letter of credit is already marked as having the products received or is closed');
        }

        letter.setStatus(Status.Received);

        await ctx.getLetterList().updateLetter(letter);
    }

    public async markAsReadyForPayment(ctx: LetterOfCreditContext, letterId: string) {
        const caller: BankEmployee = await ctx.getClientIdentity().toBankEmployee();

        const letter: LetterOfCredit = await ctx.getLetterList().getLetter(letterId);

        if (!letter.isIssuingBank(caller)) {
            throw new Error('Calling client identity is not the issuing bank');
        } else if (letter.getStatus() < Status.Received) {
            throw new Error('The letter of credit is not marked as having the products received. Cannot mark as ready for payment');
        } else if (letter.getStatus() >= Status.ReadyForPayment) {
            throw new Error('The letter of credit is already marked as being ready for payment or is closed');
        }

        letter.setStatus(Status.ReadyForPayment);

        await ctx.getLetterList().updateLetter(letter);
    }

    public async close(ctx: LetterOfCreditContext, letterId: string) {
        const caller: BankEmployee = await ctx.getClientIdentity().toBankEmployee();

        const letter: LetterOfCredit = await ctx.getLetterList().getLetter(letterId);

        if (!letter.isExportingBank(caller)) {
            throw new Error('Calling client identity is not the issuing bank');
        } else if (letter.getStatus() < Status.ReadyForPayment) {
            throw new Error('The letter of credit is not marked as being ready for payment. Cannot close')
        } else if (letter.getStatus() >= Status.Closed) {
            throw new Error('The letter of credit is already marked as closed');
        }

        letter.setStatus(Status.Closed);

        await ctx.getLetterList().updateLetter(letter);
    }

    private async getEditableLetterIfCredit(ctx: LetterOfCreditContext, letterId: string): Promise<LetterOfCredit> {
        const letter = await ctx.getLetterList().getLetter(letterId);

        if (letter.getStatus() > Status.AwaitingApproval) {
            throw new Error('The letter of credit is no longer editable');
        }

        return letter;
    }

    private async addApproval(person: Person, letter: LetterOfCredit) {
        if (letter.isApplicant(person)) {
            letter.addApplicantApproval();
        } else if (letter.isBeneficiary(person)) {
            letter.addBeneficiaryApproval();
        } else if (letter.isIssuingBank(person) || letter.isExportingBank(person)) { // Allow for cases where issuing bank is exporting bank
            
            if (letter.isIssuingBank(person)) {
                letter.addIssuingBankApproval();
            }
            
            if (letter.isExportingBank(person)) {
                letter.addExportingBankApproval();
            }
        } else {
            throw new Error('Calling client identity is not a party in the letter of credit');
        }
    }
}