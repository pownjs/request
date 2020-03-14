const url = require('url')
const util = require('util')
const http = require('http')
const zlib = require('zlib')
const https = require('https')
const isGzip = require('is-gzip')
const isDeflate = require('is-deflate')
const performanceNow = require('performance-now')

let gunzipAsync

try {
    gunzipAsync = util.promisify(zlib.gunzip.bind(zlib))
}
catch (e) {
    gunzipAsync = (input) => input
}

let deflateAsync

try {
    deflateAsync = util.promisify(zlib.deflate.bind(zlib))
}
catch (e) {
    deflateAsync = (input) => input
}

let brotliDecompressAsync

try {
    brotliDecompressAsync = util.promisify(zlib.brotliDecompress.bind(zlib))
}
catch (e) {
    brotliDecompressAsync = (input) => input
}

const transport = {
    'http:': http,
    'https:': https
}

const requestCleanup = async(req) => {
    // NOTE: force socket closure just in case

    try {
        req.socket.destroy()
    }
    catch (e) {
        // pass
    }
}

const maybeUnzip = async(buf, headers) => {
    try {
        // NOTE: guard against acidental problems as the method does not ensure decompression

        const contentEncoding = (headers[Object.keys(headers).find((k) => k.toLowerCase().trim() === 'content-encoding')] || '').toLowerCase()

        switch (contentEncoding) {
            case 'gzip':
                return await gunzipAsync(buf)

            case 'deflate':
                return await deflateAsync(buf)

            case 'br':
                return await brotliDecompressAsync(buf)
        }

        if (isGzip(buf)) {
            return await gunzipAsync(buf)
        }
        else
        if (isDeflate(buf)) {
            return await deflateAsync(buf)
        }
    }
    catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(e)
        }
    }

    return buf
}

const requestInternal = (request, resolve) => {
    const { type = 'base', method = 'GET', uri, version = 'HTTP/1.1', headers: _headers = {}, body, info, timeout = 30000, follow = false, download = true, ...rest } = request

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

    let connectTimeout

    if (timeout) {
        req.setTimeout(timeout)

        connectTimeout = setTimeout(() => {
            req.emit('timeout')
        }, timeout)
    }

    req.on('response', async(res) => {
        clearTimeout(connectTimeout)

        if (follow && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.destroy()

            await requestCleanup(req)

            requestInternal({ ...request, uri: url.resolve(transaction.uri, res.headers.location) }, resolve)

            return
        }

        transaction.responseCode = res.statusCode
        transaction.responseMessage = res.statusMessage
        transaction.responseHeaders = res.headers

        if (!download) {
            res.destroy()

            await requestCleanup(req)

            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

            resolve(transaction)

            return
        }

        res.on('timeout', async(error) => {
            error = error || new Error(`Timeout`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

            resolve(transaction)
        })

        res.on('aborted', async(error) => {
            error = error || new Error(`Aborted`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

            resolve(transaction)
        })

        res.on('abort', async(error) => {
            error = error || new Error(`Abort`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

            resolve(transaction)
        })

        res.on('error', async(error) => {
            error = error || new Error(`Error`)

            await requestCleanup(req)

            transaction.info.error = error
            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

            resolve(transaction)
        })

        let dataTimeout

        dataTimeout = setTimeout(() => {
            res.emit('timeout')
        }, timeout)

        res.on('data', (data) => {
            clearTimeout(dataTimeout)

            responseBodyDataChunks.push(data)

            dataTimeout = setTimeout(() => {
                res.emit('timeout')
            }, timeout)
        })

        res.on('end', async() => {
            clearTimeout(dataTimeout)

            await requestCleanup(req)

            transaction.info.stopTime = performanceNow()
            transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

            resolve(transaction)
        })
    })

    req.on('timeout', async(error) => {
        clearTimeout(connectTimeout)

        error = error || new Error(`Timeout`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

        resolve(transaction)
    })

    req.on('aborted', async(error) => {
        clearTimeout(connectTimeout)

        error = error || new Error(`Aborted`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

        resolve(transaction)
    })

    req.on('abort', async(error) => {
        clearTimeout(connectTimeout)

        error = error || new Error(`Abort`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

        resolve(transaction)
    })

    req.on('error', async(error) => {
        clearTimeout(connectTimeout)

        error = error || new Error(`Error`)

        await requestCleanup(req)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseBody = await maybeUnzip(Buffer.concat(responseBodyDataChunks), transaction.responseHeaders)

        resolve(transaction)
    })

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

const fetch = (uri, headers = {}, options = {}) => request({ ...options, method: 'GET', uri, headers })

module.exports = { request, fetch }
