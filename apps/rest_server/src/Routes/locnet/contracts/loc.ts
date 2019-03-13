import { Router } from 'express';
import FabricProxy from '../../../fabricproxy';
import { handleRouterCall } from '../../utils';
import { SystemContractRouter } from './system';
import { Router as IRouter } from '../../../interfaces/router';
import { ChaincodeMetadata } from '../../../interfaces/metadata_interfaces';

export class LocContractRouter implements IRouter {
    public static contractName = 'org.locnet.letterofcredit';

    private router: Router;
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        const metadataBuff = await this.fabricProxy.evaluateTransaction('system', SystemContractRouter.contractName + ':GetMetadata');
        const metadata = JSON.parse(metadataBuff.toString()) as ChaincodeMetadata;

        // manually configure the get requests as want to format in REST style
        this.router.get('/letters', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, LocContractRouter.contractName + ':getAll', [], 'evaluateTransaction', true);
        });

        this.router.get('/letters/:letterID', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, LocContractRouter.contractName + ':get', [req.params.letterID], 'evaluateTransaction', true);
        });

        // auto do the rest as I'm lazy
        metadata.contracts[LocContractRouter.contractName].transactions.filter((transaction) => {
            return transaction.tag.includes('submitTx'); // get all submit transactions as handled others above
        }).forEach((transaction) => {
            this.router.post('/' + transaction.name, (req, res) => {
                const args = [];

                if (transaction.parameters) {
                    const missingParams = [];

                    transaction.parameters.forEach((param) => {
                        if (req.body.hasOwnProperty(param.name)) {
                            const rawData = req.body[param.name];

                            if (param.schema.type && param.schema.type === 'string') {
                                args.push(rawData);
                            } else {
                                args.push(JSON.stringify(rawData));
                            }
                        } else {
                            missingParams.push(param.name);
                        }
                    });

                    if (missingParams.length > 0) {
                        res.status(400);
                        res.json({
                            msg: ['Bad request. Missing parameters: ' + missingParams.join(', ')],
                        });
                        return;
                    }
                }

                let isJSON = false;

                if (transaction.returns && transaction.returns.$ref) {
                    isJSON = true; // contract uses JSON serializer so if returns a ref we know it is JSON
                }

                handleRouterCall(req, res, this.fabricProxy, LocContractRouter.contractName + ':' + transaction.name, args, 'submitTransaction', isJSON)
            });
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}
