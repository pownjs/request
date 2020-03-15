const { Scheduler, SystemScheduler } = require('../lib/scheduler')

const assert = require('assert')

describe('scheduler', () => {
    describe('#fetch()', () => {
        const scheduler = new Scheduler()

        it('must fetch http request', async() => {
            const tran = await scheduler.fetch('http://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.equal(url, 'http://httpbin.org/get')
        })

        it('must fetch https request', async() => {
            const tran = await scheduler.fetch('https://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.equal(url, 'https://httpbin.org/get')
        })

        it('must fetch with a pause between requests', async() => {
            await scheduler.fetch('https://httpbin.org/get')

            scheduler.pause()

            const promise2 = scheduler.fetch('https://httpbin.org/get')
            const promise3 = scheduler.fetch('https://httpbin.org/get')

            scheduler.resume()

            await Promise.all([promise2, promise3])
        })
    })
})

describe('systemScheduler', () => {
    describe('#fetch()', () => {
        const scheduler = new SystemScheduler()

        it('must fetch http request', async() => {
            const tran = await scheduler.fetch('http://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.equal(url, 'http://httpbin.org/get')
        })

        it('must fetch https request', async() => {
            const tran = await scheduler.fetch('https://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.equal(url, 'https://httpbin.org/get')
        })
    })
})
