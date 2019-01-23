const Bottleneck = require('bottleneck')

const { fetch, request } = require('./request')

class Scheduler {
    constructor({concurrent}) {
        this.limiter = new Bottleneck({
            maxConcurrent: concurrent
        })
    }

    fetch(...args) {
        return this.limiter.schedule(fetch, ...args)
    }

    request(...args) {
        return this.limiter.schedule(request, ...args)
    }
}

module.exports = { Scheduler }
