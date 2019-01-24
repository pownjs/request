const request = require('../lib/request')

const assert = require('assert')

describe('request', () => {
    describe('#fetch()', () => {
        it('must fetch http request', async() => {
            const tran = await request.fetch('http://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.ok(url === 'http://httpbin.org/get', 'url === http://httpbin.org/get')
        })

        it('must fetch https request', async() => {
            const tran = await request.fetch('https://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.ok(url === 'https://httpbin.org/get', 'url === https://httpbin.org/get')
        })
    })

    describe('#request', () => {
        it('must not download body', async() => {
            const tran = await request.request({ method: 'GET', uri: 'http://httpbin.org/get', download: false })

            const { responseBody } = tran

            assert.ok(responseBody.length === 0, 'responseBody.length === 0')
        })
    })
})
