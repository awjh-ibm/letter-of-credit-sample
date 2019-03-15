/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

import { Contract } from 'fabric-contract-api';

import { LetterOfCredit } from '../letter-defs/letter';
import { LetterList } from '../letter-defs/letterlist';
import { BankEmployee, Customer, Person } from '../participant-defs/participants';
import { LOCNetContext } from '../utils/context';
import { IApproval, IProductDetails, IRule, Status, IEvidence } from '../letter-defs/letterstate';

export class LetterOfCreditContract extends Contract {
    constructor() {
        super('org.locnet.letterofcredit');
    }

    public createContext() {
        return new LOCNetContext();
    }

    public async get(ctx: LOCNetContext, letterId: string): Promise<LetterOfCredit> {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letterList: LetterList = ctx.getLetterList();

        const letter: LetterOfCredit = await letterList.getLetter(letterId);

        if (!letter.isParty(person)) {
            throw new Error('Calling client identity is not a party in the letter of credit');
        }

        return letter;
    }

    public async getAll(ctx: LOCNetContext): Promise<Array<LetterOfCredit>> {
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

    public async apply(ctx: LOCNetContext, letterId: string, beneficiaryId: string, rules: Array<IRule>, productDetails: IProductDetails) {
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

    public async approve(ctx: LOCNetContext, letterId: string) {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letter: LetterOfCredit = await this.getEditableLetterIfCredit(ctx, letterId);

        this.addApproval(person, letter);

        if (letter.fullyApproved()) {
            letter.setStatus(Status.Approved);
        }

        await ctx.getLetterList().updateLetter(letter);
    }

    public async reject(ctx: LOCNetContext, letterId: string) {
        const person: Person = await ctx.getClientIdentity().toPerson();

        const letter: LetterOfCredit = await this.getEditableLetterIfCredit(ctx, letterId);

        if (!letter.isParty(person)) {
            throw new Error('Calling client identity is not a party in the letter of credit');
        }

        letter.clearApproval();
        letter.setStatus(Status.Rejected);

        await ctx.getLetterList().updateLetter(letter);
    }

    public async suggestRuleChange(ctx: LOCNetContext, letterId: string, rules: Array<IRule>) {
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

    public async markAsShipped(ctx: LOCNetContext, letterId: string, evidence: IEvidence) {
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

    public async markAsReceived(ctx: LOCNetContext, letterId: string) {
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

    public async markAsReadyForPayment(ctx: LOCNetContext, letterId: string) {
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

    public async close(ctx: LOCNetContext, letterId: string) {
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

    private async getEditableLetterIfCredit(ctx: LOCNetContext, letterId: string): Promise<LetterOfCredit> {
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