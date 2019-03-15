/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

import * as getParams from 'get-params';

export interface IState {
    getClass(): string;
}

export class State {

    private class: string;
    private key: string;

    constructor(stateClass: string, keyParts: Array<string>) {
        this.class = stateClass;
        this.key = State.makeKey(keyParts);
    }

    public getClass(): string {
        return this.class;
    }

    public getKey(): string {
        return this.key;
    }

    public getSplitKey(): Array<string> {
        return State.splitKey(this.key);
    }

    public serialize(): Buffer {
        return State.serialize(this);
    }

    public static serialize(object: object): Buffer {
        return Buffer.from(JSON.stringify(object));
    }

    public static deserialize(data: Buffer, supportedClasses: Map<string, any>): object {
        let json = JSON.parse(data.toString());
        let objClass = supportedClasses.get(json.class);
        if (!objClass) {
            throw new Error(`Unknown class of ${json.class}`);
        }

        return this.callConstructor(objClass, json);
    }

    public static deserializeClass(data: string, objClass: any): object {
        let json = JSON.parse(data);
        return this.callConstructor(objClass, json);
    }

    private static callConstructor(objClass: any, json: object): object {
        if (!(objClass.prototype instanceof State)) {
            throw new Error(`Cannot use ${objClass.prototype.name} as type State`)
        }

        const paramNames = getParams(objClass.prototype.constructor);

        const args = [];

        if (!paramNames.every((name) => {
            if (json.hasOwnProperty(name)) {
                let arg = json[name]

                try {
                    arg = JSON.parse(arg);
                } catch (err) {
                    // wasn't JSON oh well
                }

                args.push(arg);
                return true;
            }

            return false;
        })) {
            throw new Error('Could not deserialize JSON. Missing required fields.')
        }

        let object = new (objClass)(...args);

        return object;
    }

    public static makeKey(keyParts: Array<string>): string {
        return keyParts.join(':');
    }

    public static splitKey(key: string): Array<string> {
        return key.split(':');
    }

}
