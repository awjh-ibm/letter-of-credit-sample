/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

import { Customer, Person, BankEmployee } from '../participant-defs/participants';
import { LetterOfCreditState, IRule, IEvidence, IProductDetails, IApproval, Status } from './letterstate';

export class LetterOfCredit extends LetterOfCreditState {

    protected applicant: Customer;
    protected beneficiary: Customer;

    constructor(id: string, applicant: Customer, beneficiary: Customer, rules: Array<IRule>, productDetails: IProductDetails, evidence: Array<IEvidence>, approval: IApproval, status: Status) {
        super(id, null, null, null, null, rules, productDetails, evidence, approval, status);

        this.applicant = applicant;
        this.beneficiary = beneficiary;

        delete this.applicantId;
        delete this.beneficiaryId;
        delete this.issuingBankId;
        delete this.exportingBankId;
    }

    public getApplicant(): Customer {
        return this.applicant;
    }

    public getApplicantId(): string {
        return this.applicant.getId();
    }

    public getBeneficiary(): Customer {
        return this.beneficiary;
    }

    public getBeneficiaryId(): string {
        return this.beneficiary.getId();
    }

    public getIssuingBankId(): string {
        return this.applicant.getBankId();
    }

    public getExportingBankId(): string {
        return this.beneficiary.getBankId();
    }

    public setRules(rules: Array<IRule>) {
        this.rules = rules;
    }

    public addEvidence(evidence: IEvidence) {
        this.evidence.push(evidence);
    }

    public setStatus(status: Status) {
        this.status = status;
    }

    public clearApproval() {
        this.approval.applicant = false;
        this.approval.beneficiary = false;
        this.approval.issuingBank = false;
        this.approval.exportingBank = false;
    }

    public addApplicantApproval() {
        this.approval.applicant = true;
    }

    public addBeneficiaryApproval() {
        this.approval.beneficiary = true;
    }

    public addIssuingBankApproval() {
        this.approval.issuingBank = true;
    }

    public addExportingBankApproval() {
        this.approval.exportingBank = true;
    }

    public fullyApproved(): boolean {
        return this.approval.applicant && this.approval.beneficiary && this.approval.issuingBank && this.approval.exportingBank;
    }

    public isApplicant(person: Person): boolean {
        return person.getClass() === Customer.getClass() && this.applicant.getId() === person.getId();
    }

    public isBeneficiary(person: Person): boolean {
        return person.getClass() === Customer.getClass() && this.beneficiary.getId() === person.getId();
    }

    public isIssuingBank(person: Person): boolean {
        return person.getClass() === BankEmployee.getClass() && this.applicant.getBankId() === person.getBankId();
    }

    public isExportingBank(person: Person): boolean {
        return person.getClass() === BankEmployee.getClass() && this.beneficiary.getBankId() === person.getBankId();
    }

    public isParty(person: Person) {
        return (this.isApplicant(person) || this.isBeneficiary(person) || this.isIssuingBank(person) || this.isExportingBank(person))
    }

    public isSpecificParty(person: Person, field: string) {
        switch (field.toLowerCase()) {
        case 'applicant':
            return this.isApplicant(person)
        case 'beneficiary':
            return this.isBeneficiary(person)
        case 'issuingbank':
            return this.isIssuingBank(person)
        case 'exportingbank':
            return this.isExportingBank(person)
        }
        return false
    }

    public static getClass() {
        return 'org.locnet.letterofcredit';
    }
}