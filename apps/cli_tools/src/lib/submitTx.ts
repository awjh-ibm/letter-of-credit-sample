import FabricProxy from "./fabricproxy";
import FabricConfig from "./fabricproxy.config";
import { channelName, orgName, contractName } from "./constants";

export async function submitTx(function_name: string, args: Array<string>, user: string, local_fabric: string) {
    const fpconfig: FabricConfig = {
        fabricpath: local_fabric,
        user: {
            name: user,
            org: orgName
        }
    }

    const fp = new FabricProxy(fpconfig);

    await fp.setup();

    await fp.submitTransaction(channelName, contractName, function_name, ...args);
}