const url = require('url')
const util = require('util')
const http = require('http')
const zlib = require('zlib')
const https = require('https')
const isGzip = require('is-gzip')
const isDeflate = require('is-deflate')
const performanceNow = require('performance-now')

const unzip = util.promisify(zlib.unzip.bind(zlib))

const transport = {
    'http:': http,
    'https:': https
}

const requestCleanup = async (req) => {
    // NOTE: force socket closure just in case

    try {
        req.socket.destroy()
    }
    catch (e) {
        // pass
    }
}

const maybeUnzip = async (buf) => {
    // TODO: add other response encodings

    if (isGzip(buf) || isDeflate(buf)) {
        try {
            return await unzip(buf)
        }
        catch (e) {
            return buf
        }
    }
    else {
        return buf
    }
}

const requestInternal = (request, resolve) => {
    const { type = 'base', method = 'GET', uri, version = 'HTTP/1.1', headers: _headers = {}, body, info, timeout = 30000, ...rest } = request

    const headers = { ..._headers }

    if (!headers['transfer-encoding']) {
        if (body && body.length) {
            headers['content-length'] = body.length
        }
    }

    const now = performanceNow()

    const transaction = {
        type,

        method,
        uri,
        version,
        headers,
        body,

        responseVersion: version,
        responseCode: 0,
        responseMessage: '',
        responseHeaders: {},
        responseBody: Buffer.alloc(0),

        info: {
            ...info,

            startTime: now,
            stopTime: now
        }
    }

    const options = {
        ...rest,

        ...url.parse(uri),

        method,
        headers
    }

    const responseBodyDataChunks = []

    const req = transport[options.protocol].request(options)

    req.on('response', (res) => {
        transaction.responseCode = res.statusCode
        transaction.responseMessage = res.statusMessage
        transaction.responseHeaders = res.headers

        res.on('data', (data) => {
            responseBodyDataChunks.push(data)
        })

        res.on('timeout', async (error = new Error(`Timeout`)) => {
            error = error || new Error(`Timeout`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

            resolve(transaction)
        })

        res.on('aborted', async (error = new Error(`Aborted`)) => {
            error = error || new Error(`Aborted`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

            resolve(transaction)
        })

        res.on('abort', async (error = new Error(`Abort`)) => {
            error = error || new Error(`Abort`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

            resolve(transaction)
        })

        res.on('error', async (error = new Error(`Error`)) => {
            error = error || new Error(`Error`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

            resolve(transaction)
        })

        res.on('end', async () => {
            await requestCleanup(req)

            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

            resolve(transaction)
        })
    })

    req.on('timeout', async (error = new Error(`Timeout`)) => {
        error = error || new Error(`Timeout`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

        resolve(transaction)
    })

    req.on('aborted', async (error = new Error(`Aborted`)) => {
        error = error || new Error(`Aborted`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

        resolve(transaction)
    })

    req.on('abort', async (error = new Error(`Abort`)) => {
        error = error || new Error(`Abort`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

        resolve(transaction)
    })

    req.on('error', async (error = new Error(`Error`)) => {
        error = error || new Error(`Error`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks))

        resolve(transaction)
    })

    if (timeout) {
        req.setTimeout(timeout)
    }

    req.end(body)
}

const request = (request) => new Promise((resolve, reject) => {
    try {
        // NOTE: all paths are happy paths

        requestInternal(request, resolve)
    }
    catch (e) {
        // NOTE: unless there are bugs of course

        if (process.env.NODE_ENV !== 'production') {
            console.warn('Unexpected error indicative of a bug')
            console.error(e)
        }

        reject(e)
    }
})

const fetch = (uri, headers = {}) => request({ method: 'GET', uri: uri, headers })

module.exports = { request, fetch }
