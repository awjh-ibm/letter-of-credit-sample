import { Argv } from "yargs";
import { submitTx } from "../submitTx";

export const command = 'submit [options]';

export const desc = 'submit transaction for letter of credit';

export const builder = (yargs: Argv) => {
    yargs.options({
        'fabric-config-path': {
            type: 'string',
            alias: 'p',
            required: true
        },
        'function-name': {
            type: 'string',
            alias: 'f',
            required: true
        },
        'function-args': {
            type: 'string',
            alias: 'a',
            required: true
        },
        'user': {
            type: 'string',
            alias: 'u',
            required: true
        }
    });
    yargs.usage('loc-cli submit --function-name registerBank --args \'["Bank of Dinero"]\' --user mathias --fabric-config-path local_fabric');

    return yargs;
};

export const handler = (argv: any) => {
    return argv.thePromise = submitTx(argv['function-name'], JSON.parse(argv['function-args']), argv['user'], argv['fabric-config-path']);
}