const port = process.env.PORT || 3000,
    http = require('http'),
    fs = require('fs'),
    path = require("path"),
    express = require("express"),
    socketIO = require("socket.io"),
    CalendarFetch = require("./modules/CalendarFetch.js")

const app = express()
app.use(express.static("public"))

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"))
})

app.get("/calendar", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/calendar.html"))
})

app.get("/cache/location", (req, res) => {
    res.sendFile(path.join(__dirname, "/modules/.cache/location.json"))
})
app.get("/cache/calendar", (req, res) => {
    res.sendFile(path.join(__dirname, "/modules/.cache/calendar.json"))
})

// Clear cache
const clearCache = async () => {
    try {
        await fs.rmSync(path.join(__dirname, "/modules/.cache"), { recursive: true })
    } catch (err) {
        console.error("Error while clearing cache ", err)
    }
    try {
        await fs.mkdirSync(path.join(__dirname, "/modules/.cache"))
    } catch (err) {
        console.error("Error creating cache dir", err)
    }
}
clearCache()


// Launch server (IPV4 only)
let server = app.listen(port, "0.0.0.0", async () => {
    console.log('Server running at http://127.0.0.1:' + port + '/');
})

// Init the socket
let io = socketIO(server, {
    pingInterval: 1000,
    pingTimeout: 5000, // this controls how fast the server disconnects after losing connectivity
})

io.of("/calendar").on("connection", socket => {
    console.log("Connection from /calendar")

    let currentCalendar = {}

    CalendarFetch.getCalendar()
        .then(calendar => {
            console.log("sending calendar")
            socket.emit("calendar", calendar)
            currentCalendar = calendar;
            CalendarFetch.updateCalendar(calendar)
                .then(calendar => {
                    console.log("sending updated calendar")
                    socket.emit("calendar", calendar)
                    currentCalendar = calendar
                })
        })
        .catch(error => {
            console.error("Error getting calendar:", error)
        })

    socket.on("reload", () => {
        console.log("Request to reload the calendar")
        CalendarFetch.updateCalendar(currentCalendar)
            .then(calendar => {
                console.log("sending calendar")
                socket.emit("calendar", calendar)
                currentCalendar = calendar
            })
            .catch(error => {
                console.error("Error reloading calendar:", error)
            })
    })
})

