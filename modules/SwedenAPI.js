// API for the sweden
const CalendarFetch = require("./CalendarFetch"),
    Constants = require("../constants"),
    Logger = require("./Logger"),
    InstagramScrapper = require("./InstagramScrapper")

/**
 * Get the calendar and return it
 * @param {Object} options request options. unused. 
 * @param {Response} response response to the client 
 * @returns status code of the response
 */
const getCalendar = (options, response) => {
    CalendarFetch.getCalendar()
        .then(calendar => {
            CalendarFetch.updateCalendar(calendar)
                .then(calendar => {
                    response.status(200).send(JSON.stringify(calendar))
                })
        })
        .catch(error => {
            console.error("Error getting calendar:", error)
            response.status(500).send("Error getting calendar: " + error)
        })
    return 200
}

/**
 * Update the calendar and return it
 * @param {Object} options request options. unused. 
 * @param {Response} response response to the client 
 * @returns status code of the response
 */
const updateCalendar = (options, response) => {
    console.log("Request to reload the calendar")
    CalendarFetch.updateCalendar(currentCalendar)
        .then(calendar => {
            response.status(200).send(JSON.stringify(calendar))
        })
        .catch(error => {
            console.error("Error reloading calendar:", error)
            response.status(500).send("Error getting calendar: " + error)
        })
    return 200
}

/**
 * Get the statistics on the duration in sweden and return these
 * @param {Object} options request options. unused. 
 * @param {Response} response response to the client 
 * @returns status code of the response
 */
const getDurationStatistics = (options, response) => {
    Logger.log("SwedenAPI", "Requet for the duration statistics")

    let now = new Date()
    let start = new Date(Constants.sweden.startDate)
    let end = new Date(Constants.sweden.endDate)

    let total = Math.floor((end - start) / (1000 * 60 * 60 * 24))
    let done = Math.floor((now - start) / (1000 * 60 * 60 * 24))

    let result = {
        total: total,
        done: done
    }

    response.status(200).send(JSON.stringify(result))
    return 200
}

/**
 * Get the Instagram profile of tonio_in_sweden and return information on it
 * @param {Object} options request options. unused. 
 * @param {Response} response response to the client 
 * @returns status code of the response
 */
const getInstagramProfile = (options, response) => {
    InstagramScrapper.getInstagramProfile()
        .then(profile => {
            response.status(200).send(JSON.stringify(profile))
        })
        .catch(error => {
            console.error("Error getting instagram profile:", error)
            response.status(500).send("Error instagram profile: " + error)
        })
    return 200
}

const commands = {
    'getCalendar': getCalendar,
    'updateCalendar': updateCalendar,
    'getDurationStatistics': getDurationStatistics,
    'getInstagramProfile': getInstagramProfile,
}

const handleRequest = (query, response) => {
    if (!query) {
        response.status(400).send("No args specified")
        return 400
    }
    if (!query.command) {
        response.status(400).send("No command specified")
        return 400
    }
    if (!(query.command in commands)) {
        response.status(400).send("Unknown command")
        return 400
    }
    return commands[query.command](query, response)
}

module.exports = {
    handleRequest: handleRequest
}