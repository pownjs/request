const util = require('../lib/util')

const assert = require('assert')

describe('util', () => {
    describe('#getHeader()', () => {
        it('passes', () => {
            assert.ok(!util.getHeader({}, ''))
            assert.ok(!!util.getHeader({ a: 'b' }, 'a'))

            assert.equal(util.getHeader({ a: 'b' }, 'a'), 'b')
            assert.equal(util.getHeader({ a: ['b', 'c'] }, 'a'), 'b')

            assert.equal(util.getHeader({ A: 'b' }, 'a'), 'b')
            assert.equal(util.getHeader({ A: ['b', 'c'] }, 'a'), 'b')
        })
    })
})
