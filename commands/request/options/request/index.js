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

    'connect-timeout': {
        alias: ['t', 'timeout'],
        type: 'number',
        describe: 'Maximum time allowed for connection',
        default: 30000
    },

    'accept-unauthorized': {
        alias: ['k', 'insecure'],
        type: 'boolean',
        describe: 'Accept unauthorized TLS errors',
        default: false
    }
}
