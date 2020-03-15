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

    stop() {
        return this.limiter.stop()
    }

    fetch(...args) {
        return this.limiter.schedule(fetch, ...args)
    }

    request(...args) {
        return this.limiter.schedule(request, ...args)
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
