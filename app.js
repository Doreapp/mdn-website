const port = process.env.PORT || 3000,
    http = require('http'),
    fs = require('fs'),
    path = require("path"),
    express = require("express"),
    CalendarFetch = require("./modules/CalendarFetch.js")

const app = express()
app.use(express.static("public"))

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"))
})

// Launch server (IPV4 only)
let server = app.listen(port, "0.0.0.0", async() => {
    console.log('Server running at http://127.0.0.1:' + port + '/');
})

// Lets fetch the calendar
CalendarFetch.fetchCalendar()
    .then(result => {
        console.log("Calendar fetched:\n"+result)
    })
    .catch(error => {
        console.error("Error while fetching calendar", error)
    })