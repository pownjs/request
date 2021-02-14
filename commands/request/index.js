exports.yargs = {
    command: 'request [url]',
    describe: 'Send requests',

    builder: (yargs) => {
        yargs.options('method', {
            alias: ['X'],
            type: 'string',
            describe: 'Custom method',
            default: 'GET'
        })

        yargs.options('header', {
            alias: ['H'],
            type: 'string',
            describe: 'Custom header'
        })

        yargs.options('task-concurrency', {
            alias: ['C'],
            type: 'number',
            describe: 'The number of request tasks to run at the same time',
            default: Infinity
        })

        yargs.options('request-concurrency', {
            alias: ['c'],
            type: 'number',
            describe: 'The number of requests to send at the same time',
            default: Infinity
        })

        yargs.options('filter-code', {
            alias: ['code'],
            type: 'string',
            describe: 'Filter responses with code',
            default: ''
        })

        yargs.options('print', {
            alias: ['p'],
            type: 'boolean',
            describe: 'Print response body',
            default: false
        })

        yargs.options('download', {
            alias: ['o', 'output'],
            type: 'boolean',
            describe: 'Download response body',
            default: false
        })

        yargs.options('content-sniff-size', {
            alias: ['s', 'content-sniff', 'sniff', 'sniff-size'],
            type: 'number',
            describe: 'Specify the size of the content sniff',
            default: 5
        })
    },

    handler: async(argv) => {
        const { method, header, taskConcurrency, requestConcurrency, filterCode, print, download, contentSniffSize, url } = argv

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

        const { writeFile } = require('fs')
        const { promisify } = require('util')
        const { makeLineIterator } = require('@pown/cli/lib/line')
        const { eachOfLimit } = require('@pown/async/lib/eachOfLimit')

        const { Scheduler } = require('../../lib/scheduler')

        const writeFileAsync = promisify(writeFile)

        const it = makeLineIterator(url)
        const scheduler = new Scheduler({ maxConcurrent: requestConcurrency })

        await eachOfLimit(it(), taskConcurrency, async(uri) => {
            if (!uri) {
                return
            }

            uri = uri.trim()

            if (!/https?:\/\//i.test(uri)) {
                return
            }

            const response = await scheduler.request({ uri, method, headers })

            const { responseCode, responseMessage, responseBody } = response

            if (filterCode) {
                if (filterCode != responseCode) {
                    return
                }
            }

            const responseBodySniff = responseBody.slice(0, contentSniffSize).toString('hex')

            console.info(`${method} ${uri} -> ${responseCode} [${responseMessage}] ${responseBodySniff}`)

            if (print) {
                console.log(responseBody.toString())
            }

            if (download) {
                await writeFileAsync(uri.replace(/\W+/g, '_').replace(/_+/, '_').replace(/([a-zA-Z0-9]+)$/, '.$1'), responseBody)
            }
        })
    }
}
