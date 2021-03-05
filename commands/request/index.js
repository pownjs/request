const urlOptions = require('./options/url')
const outputOptions = require('./options/output')
const requestOptions = require('./options/request')
const schedulerOptions = require('./options/scheduler')

exports.yargs = {
    command: 'request [url]',
    describe: 'Send requests',

    builder: {
        ...urlOptions,
        ...outputOptions,
        ...requestOptions,
        ...schedulerOptions,

        'task-concurrency': {
            alias: ['C'],
            type: 'number',
            describe: 'The number of request tasks to run at the same time',
            default: Infinity
        }
    },

    handler: async(argv) => {
        const { taskConcurrency, url } = argv

        const { Scheduler } = require('../../lib/scheduler')

        const scheduler = new Scheduler()

        const urlOptionsHandler = require('./options/url/handler')
        const outputOptionsHandler = require('./options/output/handler')
        const requestOptionsHandler = require('./options/request/handler')
        const schedulerOptionsHandler = require('./options/scheduler/handler')

        urlOptionsHandler.init(argv, scheduler)
        outputOptionsHandler.init(argv, scheduler)
        requestOptionsHandler.init(argv, scheduler)
        schedulerOptionsHandler.init(argv, scheduler)

        const { makeLineIterator } = require('@pown/cli/lib/line')
        const { eachOfLimit } = require('@pown/async/lib/eachOfLimit')

        const it = makeLineIterator(url)

        await eachOfLimit(it(), taskConcurrency, async(uri) => {
            if (!uri) {
                return
            }

            uri = uri.trim()

            if (!uri) {
                return
            }

            await scheduler.request({ uri })
        })
    }
}
