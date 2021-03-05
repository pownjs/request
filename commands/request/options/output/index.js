module.exports = {
    'filter-response-code': {
        alias: ['response-code', 'code', 'filter-status', 'status'],
        type: 'string',
        describe: 'Filter responses with code',
        default: ''
    },

    'content-sniff-size': {
        alias: ['content-sniff', 'sniff', 'sniff-size'],
        type: 'number',
        describe: 'Specify the size of the content sniff',
        default: 5
    },

    'print': {
        alias: [],
        type: 'boolean',
        describe: 'Print response body',
        default: false
    },

    'download': {
        alias: ['output'],
        type: 'boolean',
        describe: 'Download response body',
        default: false
    }
}
