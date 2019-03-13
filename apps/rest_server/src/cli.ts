import * as yargs from 'yargs';
import RestServer from './server';

const results = yargs
    .options({
        'wallet': {
            type: 'string',
            alias: 'w',
            required: true
        },
        'connection-profile': {
            type: 'string',
            alias: 'c',
            required: true
        },
        'port': {
            type: 'number',
            alias: 'p',
            required: false,
            default: 3000
        }
    })
    .help()
    .example('loc-rest-server --wallet ./local_fabric/wallet --connection-profile ./local_fabric/connection_profile.json --organisation Org1')
    .epilogue('rest server for loc net')
    .alias('v', 'version')
    .describe('v', 'show version information')
    .env('LOC_REST')
    .argv;

const server = new RestServer({
    walletPath: results['wallet'],
    connectionProfilePath: results['connection-profile'],
    port: results.port
});

try {
    server.start().catch((err) => {
        console.log('SERVER START ERR', err)
        throw err;
    });
} catch (err) {
    console.log('BIG ERROR EXITING', err);
    process.exit(-1);
}