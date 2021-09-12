// API for the sweden

const getCalendar = (options, response) => {
    response.status(200).send("GET Calendar not implemented yet")
    return 200
}

const updateCalendar = (options, response) => {
    response.status(200).send("UPDATE calendar not implemented yet")
    return 200
}

const commands = {
    'getCalendar': getCalendar,
    'updateCalendar': updateCalendar,
}

const handleRequest = (query, response) => {
    if(!query){
        response.status(400).send("No args specified")
        return 400
    }
    if(!query.command){
        response.status(400).send("No command specified")
        return 400
    }   
    if(!(query.command in commands)) {
        response.status(400).send("Unknown command")
        return 400
    }
    return commands[query.command](query, response)
}

module.exports = {
    handleRequest: handleRequest
}