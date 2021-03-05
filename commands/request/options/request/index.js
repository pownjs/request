module.exports = {
    'method': {
        alias: ['X'],
        type: 'string',
        describe: 'Custom method',
    },

    'header': {
        alias: ['H'],
        type: 'string',
        describe: 'Custom header'
    },

    'accept-unauthorized': {
        alias: ['k', 'insecure'],
        type: 'boolean',
        describe: 'Accept unauthorized TLS errors',
        default: false
    }
}
