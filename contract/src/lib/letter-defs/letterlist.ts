/*
SPDX-License-Identifier: Apache-2.0
*/

import { StateList } from "../ledger-api/statelist";
import { LetterOfCredit } from "./letter";
import { LetterOfCreditState } from "./letterstate";
import { LOCNetContext } from "../utils/context";

class LetterOfCreditConverter {
    public static async fromLetterOfCreditState(locs: LetterOfCreditState, ctx: LOCNetContext): Promise<LetterOfCredit> {
        const applicant = await ctx.getParticipantList().getCustomer(locs.getApplicantId());
        const beneficiary = await ctx.getParticipantList().getCustomer(locs.getBeneficiaryId());

        return new LetterOfCredit(locs.getId(), applicant, beneficiary, locs.getRules(), locs.getProductDetails(), locs.getEvidence(), locs.getApproval(), locs.getStatus());
    }

    public static toLetterOfCreditState(loc: LetterOfCredit): LetterOfCreditState {
        return new LetterOfCreditState(loc.getId(), loc.getApplicant().getId(), loc.getBeneficiary().getId(), loc.getApplicant().getBankId(), loc.getBeneficiary().getBankId(), loc.getRules(), loc.getProductDetails(), loc.getEvidence(), loc.getApproval(), loc.getStatus());
    }
}

export class LetterList extends StateList {
    constructor (ctx: LOCNetContext) {
        super(ctx, 'org.locnet.letterofcreditlist');
        this.use(LetterOfCreditState);
    }

    async addLetter(letter: LetterOfCredit) {
        try {
            return this.addState(LetterOfCreditConverter.toLetterOfCreditState(letter));
        } catch (err) {
            throw new Error('Failed to add letter. ERROR: ' + err.message);
        }
    }

    async getLetter(letterKey: string): Promise<LetterOfCredit> {
        let rawLetter;

        try {
            rawLetter = await this.getState(letterKey) as LetterOfCreditState;
        } catch (err) {
            throw new Error('Failed to get letter state. ERROR: ' + err.message);
        }

        return LetterOfCreditConverter.fromLetterOfCreditState(rawLetter, this.getCtx() as LOCNetContext);
    }

    async getAllLetters(): Promise<Map<string, LetterOfCredit>> {
        let rawLetters;

        try {
            rawLetters = await this.getAllStates() as Map<string, LetterOfCreditState>;
        } catch (err) {
            throw new Error('Failed to get all letters for user. ERROR: ' + err.message);
        }

        const lettersMap: Map<string, LetterOfCredit> = new Map();

        for (let [key, rawLetter] of rawLetters) {
            lettersMap.set(key, await LetterOfCreditConverter.fromLetterOfCreditState(rawLetter, this.getCtx() as LOCNetContext));
        }

        return lettersMap;
    }

    async updateLetter(letter: LetterOfCredit) {
        try {
            return this.updateState(LetterOfCreditConverter.toLetterOfCreditState(letter));
        } catch (err) {
            throw new Error('Failed to update letter. ERROR: ' + err.message);
        }
    }
}