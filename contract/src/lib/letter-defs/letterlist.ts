/*
SPDX-License-Identifier: Apache-2.0
*/

import { StateList } from "../ledger-api/statelist";
import { LetterOfCredit } from "./letter";
import { LetterOfCreditState } from "./letterstate";
import { LetterOfCreditContext } from "../utils/context";

class LetterOfCreditConverter {
    public static async fromLetterOfCreditState(locs: LetterOfCreditState, ctx: LetterOfCreditContext): Promise<LetterOfCredit> {
        const applicant = await ctx.getParticipantList().getCustomer(locs.getApplicantId());
        const beneficiary = await ctx.getParticipantList().getCustomer(locs.getBeneficiaryId());

        return new LetterOfCredit(locs.getId(), applicant, beneficiary, locs.getRules(), locs.getProductDetails(), locs.getEvidence(), locs.getApproval(), locs.getStatus());
    }

    public static toLetterOfCreditState(loc: LetterOfCredit): LetterOfCreditState {
        return new LetterOfCreditState(loc.getId(), loc.getApplicant().getId(), loc.getBeneficiary().getId(), loc.getApplicant().getBankId(), loc.getBeneficiary().getBankId(), loc.getRules(), loc.getProductDetails(), loc.getEvidence(), loc.getApproval(), loc.getStatus());
    }
}

export class LetterList extends StateList {
    constructor (ctx: LetterOfCreditContext) {
        super(ctx, 'org.locnet.letterofcreditlist');
        this.use(LetterOfCreditState);
    }

    async addLetter(letter: LetterOfCredit) {
        return this.addState(LetterOfCreditConverter.toLetterOfCreditState(letter));
    }

    async getLetter(letterKey: string): Promise<LetterOfCredit> {
        const rawLetter = await this.getState(letterKey) as LetterOfCreditState;

        return LetterOfCreditConverter.fromLetterOfCreditState(rawLetter, this.getCtx() as LetterOfCreditContext);
    }

    async getAllLetters(): Promise<Map<string, LetterOfCredit>> {
        const rawLetters = await this.getAllStates() as Map<string, LetterOfCreditState>;

        const lettersMap: Map<string, LetterOfCredit> = new Map();

        for (let [key, rawLetter] of rawLetters) {
            lettersMap.set(key, await LetterOfCreditConverter.fromLetterOfCreditState(rawLetter, this.getCtx() as LetterOfCreditContext));
        }

        return lettersMap;
    }

    async updateLetter(letter: LetterOfCredit) {
        return this.updateState(LetterOfCreditConverter.toLetterOfCreditState(letter));
    }
}