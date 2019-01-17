const lib = require('../lib')

const assert = require('assert')

describe('lib', () => {
    describe('#fetch()', () => {
        it('must fetch http request', async() => {
            const tran = await lib.fetch('http://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.ok(url === 'http://httpbin.org/get', 'url === http://httpbin.org/get')
        })

        it('must fetch https request', async() => {
            const tran = await lib.fetch('https://httpbin.org/get')

            const { responseBody } = tran

            const { url } = JSON.parse(responseBody.toString())

            assert.ok(url === 'https://httpbin.org/get', 'url === https://httpbin.org/get')
        })
    })
})
