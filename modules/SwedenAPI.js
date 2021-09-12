// API for the sweden
const CalendarFetch = require("./CalendarFetch"),
    Constants = require("../constants")

let currentCalendar = undefined

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

const getDurationStatistics = (options, response) => {
    //TODO
}

const commands = {
    'getCalendar': getCalendar,
    'updateCalendar': updateCalendar,
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