'use strict';
/*
* SPDX-License-Identifier: Apache-2.0
*/

export default interface FabricConfig {
    fabricpath: string;
    user: {
        name: string;
        org: string;
    };
}