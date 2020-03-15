const { EventEmitter } = require('events')
const { Bottleneck } = require('@pown/async/lib/bottleneck')

const { request } = require('./request')

const systemLimiter = new Bottleneck({ /* TODO: system options to follow */ })

class SystemScheduler extends EventEmitter {
    constructor() {
        super()

        this.limiter = systemLimiter
    }

    update(options) {
        this.limiter.updateSettings(options)
    }

    stop() {
        return this.limiter.stop()
    }

    wrap(func) {
        return async(options) => {
            this.emit('task-executed', options)

            const result = await func(options)

            this.emit('task-finished', options, result)

            return result
        }
    }

    async schedule(func, options) {
        this.emit('task-scheduled', options)

        const result = await this.limiter.schedule(func, options)

        this.emit('task-completed', options, result)

        return result
    }

    request(options) {
        return this.schedule(this.wrap(request), options)
    }
}

class Scheduler extends SystemScheduler {
    constructor(options) {
        super()

        const limiter = new Bottleneck(options)

        limiter.chain(this.limiter)

        this.limiter = limiter
    }

    pause() {
        this.update({ reservoir: 0 })
    }

    resume() {
        this.update({ reservoir: null })
    }
}

module.exports = { Scheduler, SystemScheduler, systemLimiter }
