const { writeFile } = require('fs')
const { promisify } = require('util')

const writeFileAsync = promisify(writeFile)

const init = (options, scheduler) => {
    const { filterResponseCode, contentSniffSize, print, download } = options

    scheduler.on('request-finished', (request, response) => {
        const { method, uri, responseCode, responseBody } = response

        if (filterResponseCode) {
            if (filterResponseCode != responseCode) {
                return
            }
        }

        const responseBodySniff = responseBody.slice(0, contentSniffSize).toString('hex')

        console.info(`${method} ${uri} -> ${responseCode} ${responseBody.length} ${responseBodySniff}`)

        if (print) {
            console.log(responseBody.toString())
        }

        if (download) {
            writeFileAsync(uri.replace(/\W+/g, '_').replace(/_+/, '_').replace(/([a-zA-Z0-9]+)$/, '.$1'), responseBody)
        }
    })
}

module.exports = { init }
