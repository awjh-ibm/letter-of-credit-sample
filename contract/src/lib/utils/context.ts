/*
SPDX-License-Identifier: Apache-2.0
*/

import {  Context } from 'fabric-contract-api';

import { LetterList } from '../letter-defs/letterlist';
import { ParticipantList } from '../participant-defs/participantslist';
import { LetterOfCreditClientIdentity } from './clientidentity';

export class LetterOfCreditContext extends Context {

    private letterList: LetterList;
    private participantList: ParticipantList;
    private locClientIdentity: LetterOfCreditClientIdentity;

    constructor() {
        super();

        // All letters of credit are held in a list of letter of credits
        this.letterList = new LetterList(this);
        this.participantList = new ParticipantList(this);
    }

    public getClientIdentity(): LetterOfCreditClientIdentity {
        if (!this.locClientIdentity) {
            this.locClientIdentity = new LetterOfCreditClientIdentity(this);
        }
        return this.locClientIdentity;
    }

    public getLetterList(): LetterList {
        return this.letterList;
    }

    public getParticipantList(): ParticipantList {
        return this.participantList;
    }
}