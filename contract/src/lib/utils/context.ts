/*
SPDX-License-Identifier: Apache-2.0
*/

import {  Context } from 'fabric-contract-api';

import { LetterList } from '../letter-defs/letterlist';
import { ParticipantList } from '../participant-defs/participantslist';
import { LOCNetClientIdentity } from './clientidentity';

export class LOCNetContext extends Context {

    private letterList: LetterList;
    private participantList: ParticipantList;
    private locClientIdentity: LOCNetClientIdentity;

    constructor() {
        super();

        // All letters of credit are held in a list of letter of credits
        this.letterList = new LetterList(this);
        this.participantList = new ParticipantList(this);
    }

    public getClientIdentity(): LOCNetClientIdentity {
        if (!this.locClientIdentity) {
            this.locClientIdentity = new LOCNetClientIdentity(this);
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