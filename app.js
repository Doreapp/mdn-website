const port = process.env.PORT || 3000,
    http = require('http'),
    fs = require('fs'),
    path = require("path"),
    express = require("express"),
    socketIO = require("socket.io"),
    CalendarFetch = require("./modules/CalendarFetch.js"),
    InstagramScrapper = require("./modules/InstagramScrapper.js"),
    Logger = require("./modules/Logger.js")

const app = express()
app.use(express.static("public"))

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"))
})

const swedenFolder = path.join(__dirname, "/public/sweden"),
    baseSwedenRoute = "/sweden"
fs.readdir(swedenFolder, (err, files) => {
    if(err){
        console.err("Error reading dir 'sweden'",err)
        return
    }
    
    files.forEach(file => {
        if(file.endsWith(".html")) {
            if(file == "index.html") {
                app.get(baseSwedenRoute, (req, res) => {
                    res.sendFile(path.join(swedenFolder, file))
                })
            } else {
                app.get(baseSwedenRoute + "/" + file.substring(0, file.length-5), (req, res) => {
                    res.sendFile(path.join(swedenFolder, file))
                })
            }
        }
    }) 
})

app.get("/calendar", (req, res) => {
    res.sendFile()
})

app.get("/cache/location", (req, res) => {
    res.sendFile(path.join(__dirname, "/modules/.cache/location.json"))
})
app.get("/cache/calendar", (req, res) => {
    res.sendFile(path.join(__dirname, "/modules/.cache/calendar.json"))
})

// Clear cache
const clearCache = async() => {
    Logger.log("Server", "Clearing cache")
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
let server = app.listen(port, "0.0.0.0", async() => {
    console.log('Server running at http://127.0.0.1:' + port + '/');
    Logger.log("Server","Server running, using port " + port)
})

// Init the socket
let io = socketIO(server, {
    pingInterval: 1000,
    pingTimeout: 5000, // this controls how fast the server disconnects after losing connectivity
})

io.of("/calendar").on("connection", socket => {
    console.log("Connection from /calendar")
    Logger.log("Server","Connection from /calendar io")

    let currentCalendar = {}

    CalendarFetch.getCalendar()
        .then(calendar => {
            Logger.log("Server","sending calendar to client")
            socket.emit("calendar", calendar)
            currentCalendar = calendar;
            CalendarFetch.updateCalendar(calendar)
                .then(calendar => {
                    Logger.log("Server","calendar updated. Sending up-to-date version to client")
                    socket.emit("calendar", calendar)
                    currentCalendar = calendar
                })
        })
        .catch(error => {
            console.error("Error getting calendar:", error)
            Logger.log("Server","Error getting calendar: "+JSON.stringify(error))
        })

    socket.on("reload", () => {
        console.log("Request to reload the calendar")
        Logger.log("Server","Request from client to reload the calender")
        CalendarFetch.updateCalendar(currentCalendar)
            .then(calendar => {
                Logger.log("Server","Calendar updated. Sending up-to-date version to client")
                socket.emit("calendar", calendar)
                currentCalendar = calendar
            })
            .catch(error => {
                console.error("Error reloading calendar:", error)
                Logger.log("Server", "Error reloading calendar: "+JSON.stringify(error))
            })
    })
})