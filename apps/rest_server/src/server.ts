'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

import * as express from 'express';
import * as bodyParser from 'body-parser';

import * as swaggerUi from 'swagger-ui-express';

import { Swagger } from './interfaces/swagger';
import { ServerConfig } from './interfaces/config';
import FabricProxy from './fabricproxy';
import { Router } from './Routes';

export default class RestServer {

    private config: ServerConfig;
    private swagger: Swagger;

    private app: express.Application;

    // CONSTRUCT WITH CONFIG PASSED
    // HAVE START FUNCTION THAT PRESENTS API LOADS ROUTES AND STARTS UP SERVER
    // MAKE ROUTE FOR LOGIN - ASSUME THAT ENROLL HAS HAPPENED. APPS WILL THEN CONNECT ON
    // STARTUP TO LOGIN AND GET A TOKEN FOR THEIR USER, SENDING THAT TOKEN WILL ENSURE
    // CHOOSE WHICH CLIENT IDENTITY IS USED FOR TRANSACTION SUBMITAL

    public constructor(config: ServerConfig) {
        this.config = config;
        this.swagger = {
            openapi: '3.0.0',
        } as Swagger;
    }

    public async start() {
        const fabricProxy = new FabricProxy({
            walletPath: this.config.walletPath,
            connectionProfilePath: this.config.connectionProfilePath,
            channelName: 'locnet',
            contractName: 'letters-of-credit-chaincode'
        });

        console.log('STARTING SERVER WITH:', JSON.stringify(this.config));

        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));

        const router = new Router(fabricProxy);
        await router.prepareRoutes();

        this.app.get('/', (req, res) => {
            res.send('Server up');
        });

        this.app.use(router.getRouter());

        this.app.listen(this.config.port, () => {
            console.log(`Server listening on port ${this.config.port}!`);
        });
    }
}
