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

    stop() {
        if (this.pin) {
            this.pin.resolve()
        }

        return super.stop()
    }

    pause() {
        if (this.pin) {
            return this.pin.promise
        }
        else {
            const pin = this.pin = new class {
                constructor() {
                    this.promise = new Promise((resolve, reject) => {
                        this.resolve = resolve
                        this.reject = reject
                    })
                }
            }

            return this.limiter.schedule(() => {
                return pin.promise
            })
        }
    }

    resume() {
        if (this.pin) {
            const promise = this.pin.resolve()

            delete this.pin

            return promise
        }
    }
}

module.exports = { Scheduler, SystemScheduler, systemLimiter }
