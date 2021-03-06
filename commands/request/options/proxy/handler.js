const ProxyAgent = require('proxy-agent')

const init = (options, scheduler) => {
    const { proxyUrl } = options

    scheduler.on('request-scheduled', (request) => {
        request.agent = new ProxyAgent(proxyUrl)
    })
}

module.exports = { init }
