const fs = require('fs'),
    path = require("path");

const logFolder = path.join(__dirname, "logs")

const fileName = () => {
    let now = new Date()
    _ = i => i < 10 ? "0" + i : "" + i

    return now.getFullYear() + "-" + _(now.getMonth()) + "-" + _(now.getDate()) + "_" + _(now.getHours()) + "-" + _(now.getMinutes()) + "-" + _(now.getSeconds()) + ".log"
}

if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
}

const text = (tag, msg) => {
    let now = new Date()
    _ = i => i < 10 ? "0" + i : "" + i
    __ = i => i < 10 ? "00" + i : i < 100 ? "0" + i : "" + i
    return _(now.getHours()) + ":" + _(now.getMinutes()) + ":" + _(now.getSeconds()) + ":" + __(now.getMilliseconds()) + "\t" +
        tag.replace(/[\n\t]/g, "").trim() + ": " +
        msg.replace(/\n/g, "\n\t") + "\n"
}

const file = path.join(logFolder, fileName()) // rawCalendar file

module.exports = {
    log: (tag, message) => {
        fs.appendFileSync(file, text(tag, message))
    }
}