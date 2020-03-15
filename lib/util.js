const getHeader = (headers, search) => {
    search = search.toLocaleLowerCase()

    for (let [name, value] of Object.entries(headers)) {
        if (name.toLocaleLowerCase() == search) {
            if (Array.isArray(value)) {
                return value[0]
            }
            else {
                return value
            }
        }
    }
}

module.exports = { getHeader }
