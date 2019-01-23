const Bottleneck = require('bottleneck')

const { fetch, request } = require('./request')

const systemScheduler = new Bottleneck({ /* TODO: system options to follow */ })

class Scheduler {
    constructor(options) {
        this.limiter = new Bottleneck(options)

        this.run = this.run.bind(this)
    }

    run(func, ...args) {
        return this.limiter.schedule(func, ...args)
    }

    fetch(...args) {
        return systemScheduler.schedule(this.run, fetch, ...args)
    }

    request(...args) {
        return systemScheduler.schedule(this.run, request, ...args)
    }
}

module.exports = { Scheduler, Bottleneck, systemScheduler }
