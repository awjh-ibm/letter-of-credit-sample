/*
SPDX-License-Identifier: Apache-2.0
*/

import { State } from "../ledger-api/state";

export interface IRule {
    name: string;
    wording: string;
}

export interface IProductDetails {
    productType: string;
    quantity: number;
    unitPrice: number;
}

export interface IApproval {
    applicant: boolean;
    beneficiary: boolean;
    issuingBank: boolean;
    exportingBank: boolean;
}

export interface IEvidence {
    name: string;
    hash: string;
}

export enum Status {
    AwaitingApproval,
	Approved,
	Shipped,
	Received,
	ReadyForPayment,
	Closed,
	Rejected
}

export class LetterOfCreditState extends State {

    private id: string;
    protected applicantId: string;
    protected beneficiaryId: string;
    protected issuingBankId: string;
    protected exportingBankId: string;
    protected rules: Array<IRule>;
    protected productDetails: IProductDetails;
    protected evidence: Array<IEvidence>;
    protected approval: IApproval;
    protected status: Status;

    constructor(id: string, applicantId: string, beneficiaryId: string, issuingBankId: string, exportingBankId: string, rules: Array<IRule>, productDetails: IProductDetails, evidence: Array<IEvidence>, approval: IApproval, status: Status) {
        super(LetterOfCreditState.getClass(), [id])

        this.id = id;
        this.applicantId = applicantId;
        this.beneficiaryId = beneficiaryId;
        this.issuingBankId = issuingBankId;
        this.exportingBankId = exportingBankId;
        this.rules = rules;
        this.productDetails = productDetails;
        this.evidence = evidence;
        this.approval = approval;
        this.status = status;
    }

    public getId(): string {
        return this.id;
    }

    public getApplicantId(): string {
        return this.applicantId;
    }

    public getBeneficiaryId(): string {
        return this.beneficiaryId;
    }

    public getIssuingBankId(): string {
        return this.issuingBankId;
    }

    public getExportingBankId(): string {
        return this.exportingBankId;
    }

    public getRules(): Array<IRule> {
        return this.rules;
    }

    public getProductDetails(): IProductDetails {
        return this.productDetails;
    }

    public getEvidence(): Array<IEvidence> {
        return this.evidence;
    }

    public getApproval(): IApproval {
        return this.approval;
    }

    public getStatus(): Status {
        return this.status;
    }

    public static getClass(): string {
        return 'org.locnet.letterofcredit';
    }
}