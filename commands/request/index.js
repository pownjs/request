exports.yargs = {
    command: 'request [url]',
    describe: 'Send requests',

    builder: (yargs) => {
        yargs.options('method', {
            alias: 'X',
            type: 'string',
            describe: 'Custom method',
            default: 'GET'
        })

        yargs.options('header', {
            alias: 'H',
            type: 'string',
            describe: 'Custom header'
        })

        yargs.options('task-concurrency', {
            alias: 'C',
            type: 'number',
            default: Infinity
        })

        yargs.options('request-concurrency', {
            alias: 'c',
            type: 'number',
            default: Infinity
        })
    },

    handler: async(argv) => {
        const { method, header, taskConcurrency, requestConcurrency, url } = argv

        const headers = {}

        if (header) {
            if (!Array.isArray(header)) {
                header = [header]
            }

            for (let entry of header) {
                let [name = '', value = ''] = entry.split(':', 1)

                name = name.trim() || entry
                value = value.trim() || ''

                if (headers[name]) {
                    if (!Array.isArray(headers[name])) {
                        headers[name] = [headers[name]]
                    }

                    headers[name].push(value)
                }
                else {
                    headers[name] = value
                }
            }
        }

        const { makeLineIterator } = require('@pown/cli/lib/line')
        const { eachOfLimit } = require('@pown/async/lib/eachOfLimit')

        const { Scheduler } = require('../../lib/scheduler')

        const it = makeLineIterator(url)
        const scheduler = new Scheduler({ maxConcurrent: requestConcurrency })

        await eachOfLimit(it(), taskConcurrency, async(uri) => {
            const { responseCode, responseMessage } = await scheduler.request({ uri, method, headers })

            console.log(`${method} ${uri} -> ${responseCode} ${responseMessage}`)
        })
    }
}
