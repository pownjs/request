const { Scheduler } = require('../lib/scheduler')

const assert = require('assert')

describe('scheduler', () => {
    describe('#fetch()', () => {
        const scheduler = new Scheduler({concurrent: 1})

        it('must fetch http request', async() => {
            const tran = await scheduler.fetch('http://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.ok(url === 'http://httpbin.org/get', 'url === http://httpbin.org/get')
        })

        it('must fetch https request', async() => {
            const tran = await scheduler.fetch('https://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.ok(url === 'https://httpbin.org/get', 'url === https://httpbin.org/get')
        })
    })
})
