const { Bottleneck } = require('@pown/async/lib/bottleneck')

const { fetch, request } = require('./request')

const systemLimiter = new Bottleneck({ /* TODO: system options to follow */ })

class SystemScheduler {
    constructor() {
        this.limiter = systemLimiter
    }

    update(...args) {
        this.limiter.updateSettings(...args)
    }

    fetch(...args) {
        return this.limiter.schedule(fetch, ...args)
    }

    request(...args) {
        return this.limiter.schedule(request, ...args)
    }
}

class Scheduler {
    constructor(options) {
        this.limiter = new Bottleneck(options)

        this.limiter.chain(systemLimiter)
    }

    stop() {
        this.limiter.stop()
    }

    update(...args) {
        this.limiter.updateSettings(...args)
    }

    fetch(...args) {
        return this.limiter.schedule(fetch, ...args)
    }

    request(...args) {
        return this.limiter.schedule(request, ...args)
    }
}

module.exports = { Scheduler, SystemScheduler, systemLimiter }
