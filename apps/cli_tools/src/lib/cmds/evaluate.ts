import { Argv } from "yargs";
import { submitTx } from "../submitTx";
import { evaluateTx } from "../evaluateTx";

export const command = 'evaluate [options]';

export const desc = 'evaluate transaction for letter of credit';

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
    yargs.usage('loc-cli evaluate --function-name get --args \'["LETTER_1"]\' --user mathias --fabric-config-path local_fabric');

    return yargs;
};

export const handler = (argv: any) => {
    return argv.thePromise = evaluateTx(argv['function-name'], JSON.parse(argv['function-args']), argv['user'], argv['fabric-config-path']);
}