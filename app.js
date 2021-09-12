const port = process.env.PORT || 3000,
    http = require('http'),
    fs = require('fs'),
    path = require("path"),
    express = require("express"),
    Logger = require("./modules/Logger.js"),
    SwedenAPI = require("./modules/SwedenAPI")

const app = express()
app.use(express.static("public"))

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"))
})

const swedenFolder = path.join(__dirname, "/public/sweden"),
    baseSwedenRoute = "/sweden"
fs.readdir(swedenFolder, (err, files) => {
    if (err) {
        console.err("Error reading dir 'sweden'", err)
        return
    }

    files.forEach(file => {
        if (file.endsWith(".html")) {
            if (file == "index.html") {
                app.get(baseSwedenRoute, (req, res) => {
                    res.sendFile(path.join(swedenFolder, file))
                })
            } else {
                app.get(baseSwedenRoute + "/" + file.substring(0, file.length - 5), (req, res) => {
                    res.sendFile(path.join(swedenFolder, file))
                })
            }
        }
    })
})

app.get("/cache/location", (req, res) => {
    res.sendFile(path.join(__dirname, "/modules/.cache/location.json"))
})
app.get("/cache/calendar", (req, res) => {
    res.sendFile(path.join(__dirname, "/modules/.cache/calendar.json"))
})

app.get("/sweden/api", (req, res) => {
    SwedenAPI.handleRequest(req.query, res)
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
    Logger.log("Server", "Server running, using port " + port)
})