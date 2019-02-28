/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
import { State, IState } from './state';
import { Context } from 'fabric-contract-api';

export class StateList {

    private ctx: Context;
    private name: string;
    private supportedClasses: Map<string, IState>

    constructor(ctx: Context, listName: string) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = new Map();
    }
    
    getCtx(): Context {
        return this.ctx;
    }

    async addState(state: any) {
        if (!(state instanceof State)) {
            throw new Error(`Cannot use ${state.constructor.name} as type State`)
        }

        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        const data = state.serialize();

        const buff = await this.ctx.stub.getState(key);

        if (buff.length > 0) {
            throw new Error('Cannot create new state. State already exists for key');
        }

        await this.ctx.stub.putState(key, data);
    }

    async getState(key: string): Promise<any> {
        const ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        const data = await this.ctx.stub.getState(ledgerKey);

        if (data.length === 0) {
            throw new Error('Cannot get state. No state exists for key');
        }

        const state = State.deserialize(data, this.supportedClasses);
        return state;
    }

    async getAllStates(): Promise<Map<string, any>> {
        const data = await this.ctx.stub.getStateByPartialCompositeKey(this.name, []);

        const states = new Map();

        while (true) {
            const { value, done } = await data.next();
            const state = State.deserialize(value.getValue().toBuffer(), this.supportedClasses);
            states.set(splitCompositeKey(value.getKey()), state)

            if (done) {
                break;
            }
        }

        return states;
    }

    async updateState(state: any) {
        if (!(state instanceof State)) {
            throw new Error(`Cannot use ${state.constructor.name} as type State`)
        }

        const key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        const data = state.serialize();

        const buff = await this.ctx.stub.getState(key);

        if (buff.length === 0) {
            throw new Error('Cannot update state. No state exists for key');
        }

        await this.ctx.stub.putState(key, data);
    }

    use(stateClass: IState) {
        if (!((stateClass as any).prototype instanceof State)) {
            throw new Error(`Cannot use ${(stateClass as any).prototype.constructor.name} as type State`)
        }

        this.supportedClasses.set(stateClass.getClass(), stateClass);
    }

}

const MIN_UNICODE_RUNE_VALUE = '\u0000';
const COMPOSITEKEY_NS = '\x00';

function splitCompositeKey (compositeKey) {
    const result = {objectType: null, attributes: []};
    if (compositeKey && compositeKey.length > 1 && compositeKey.charAt(0) === COMPOSITEKEY_NS) {
        const splitKey = compositeKey.substring(1).split(MIN_UNICODE_RUNE_VALUE);
        result.objectType = splitKey[0];
        splitKey.pop();
        if (splitKey.length > 1) {
            splitKey.shift();
            result.attributes = splitKey;
        }
    }
    return result;
}
