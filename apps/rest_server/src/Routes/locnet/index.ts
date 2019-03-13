import FabricProxy from '../../fabricproxy';
import { Router } from 'express';
import { SystemContractRouter } from './contracts/system';
import { LocContractRouter } from './contracts/loc';
import { Router as IRouter } from '../../interfaces/router';

export class LocnetRouter implements IRouter {
    private router: Router;
    private fabricProxy: FabricProxy;

    constructor (fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        const sysContractRouter = new SystemContractRouter(this.fabricProxy);
        const locContractRouter = new LocContractRouter(this.fabricProxy);

        await sysContractRouter.prepareRoutes();
        await locContractRouter.prepareRoutes();

        this.router.use(`/${SystemContractRouter.contractName}`, sysContractRouter.getRouter());
        this.router.use(`/${LocContractRouter.contractName}`, locContractRouter.getRouter());
    }

    public getRouter(): Router {
        return this.router;
    }
}
