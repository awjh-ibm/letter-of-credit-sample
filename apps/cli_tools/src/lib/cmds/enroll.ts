import { Enroll } from "../enroll";
import { Argv } from "yargs";

export const command = 'enroll [options]';

export const desc = 'enroll users for letter of credit';

export const builder = (yargs: Argv) => {
    yargs.options({
        'fabric-config-path': {
            type: 'string',
            alias: 'p',
            required: true
        }
    });
    yargs.usage('loc-cli enroll --fabric-config-path local_fabric');

    return yargs;
};

export const handler = (argv: any) => {
    return argv.thePromise = Enroll.enrollUsers(argv['fabric-config-path']);
}