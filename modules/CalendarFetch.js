const https = require('https'),
  fs = require('fs'),
  path = require("path"),
  translation = require("./Translation.js")

// Files
const cacheFolder = path.join(__dirname, ".cache"), // Main cache folder
  rawCalendarFile = path.join(cacheFolder, "rawCalendar.ics"), // rawCalendar file
  parsedCalenderFile = path.join(cacheFolder, "calendar.json") // parsed calendar file

// Calendar URL
const URL = "https://www.kth.se/social/user/282379/icalendar/b5167b5d6e589f7c7bc356529c66bcdf6721b93c"

/**
 * Saves the raw calendar string into the cache file
 * @param {string} raw calendar string content 
 * @returns promise
 */
const saveRawCalendar = (raw) => {
  console.log("Saving raw calendar into "+rawCalendarFile+", "+raw.length+" characters")
  return new Promise((resolve, reject) => {
    fs.writeFile(rawCalendarFile, raw, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Read the raw calendar file
 * @returns Promise, when fullfiled, provides the file content 
 */
const getRawCalendar = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(rawCalendarFile, "utf-8", function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Save the parsed calendar into a cache file
 * @param {Object} json JSON object to save 
 * @returns promise
 */
const saveParsedCalendar = (json) => {
  console.log("Saving parsed calendar into "+parsedCalenderFile)
  return new Promise((resolve, reject) => {
    fs.writeFile(parsedCalenderFile, JSON.stringify(json), function (err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Read the saved parsed calendar, as a JSON Object
 * @returns promise, once fullfiled provides the calendar object 
 */
const getParsedCalendar = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(parsedCalenderFile, "utf-8", function (err, data) {
      if (err) {
        reject(err)
      } else {
        try {
          let json = JSON.parse(data)
          resolve(json)
        } catch (err) {
          reject(err)
        }
      }
    })
  })
}


/**
 * Execute a HTTPS GET request. 
 * Provide the return 
 * @param {string} url URL to fetch 
 * @returns Promise, when fullfiled, provide the request response content (body)
 */
const executeGet = (url) => {
  console.log("GET "+url)
  return new Promise((resolve, reject) => {
    const req = https.request(url,
      {
        port: 443,
        method: 'GET'
      }, res => {
        // Read the content (body)
        let result = ""

        res.on('data', data => {
          // Fill the buffer
          result += data.toString()
        })

        res.on('end', () => {
          // Resolve the promise
          resolve(result)
        })
      })

    req.on('error', error => {
      reject(error)
    })

    req.end()
  })
}

/**
 * Fetch the calendar from the online URL
 * @param {string} url Optional calendar file url  
 * @returns promise, when fullfiled provides the raw calendar file content
 */
const fetchCalendar = (url = URL) => {
  console.log("Fetch calendar")
  return executeGet(url)
}

/**
 * Parse the datetime from the calendar format (YYYYMMDDTHHMMSS)
 * @param {string} str datetime string to parse 
 * @returns {Date} parsed date
 */
const parseDatetime = str => {
  const _ = i => i < 10 ? "0" + i : "" + i
  const datestr = str.substring(0, 4) + "-" +
    str.substring(4, 6) + "-" +
    str.substring(6, 8) + "T" +
    _(parseInt(str.substring(9, 11)) + 2) + ":" +
    str.substring(11, 13) + ":00"
  return new Date(Date.parse(datestr))
}

/**
 * Parse the raw calendar
 * @param {string} raw raw calendar content 
 */
const parseRawCalendar = (raw) => {
  return new Promise((resolve, reject) => {
    console.log("Parsing started")

    let currentMax = 0
    // Build with full lines
    let lines = raw.replace(/\r?\n /g, "").split(/\r?\n/)

    // Initialize results
    let calendar = {}
    calendar.events = []

    let currentNode = calendar
    calendar.updateTime = Date.now()

    // Read throught the raw string
    for (let i = 0; i < lines.length; i++) {
      let separationIndex = lines[i].indexOf(":")
      if (separationIndex >= 0) {
        // Read key and value 
        let key = lines[i].substring(0, separationIndex),
          value = lines[i].substring(separationIndex + 1)

        switch (key) {
          case "BEGIN":
            if (value === "VEVENT") {
              let event = {}
              calendar.events.push(event)
              currentNode = event
            }
            break
          case "VERSION":
            currentNode.version = value
            break
          case "URL":
            currentNode.url = value
            break
          case "SUMMARY":
            currentNode.summary = value
            break
          case "DTSTART;VALUE=DATE-TIME":
            currentNode.startTime = parseDatetime(value)
            break
          case "DTEND;VALUE=DATE-TIME":
            currentNode.endTime = parseDatetime(value)
            break
          case "LOCATION":
            currentNode.location = value
            break
          case "DESCRIPTION":
            currentNode.description = value
            break
        }
      } // Otherwise skip
    }

    console.log("Calendar parsed, "+calendar.events.length+" events found")
    resolve(calendar)
  })
}

const appendInformationUsingUrl = (calendar) => {
  console.log("Request to fetch information for "+calendar.events.length+" events")
  return new Promise((resolve, reject) => {

    // Parseing finished, now fetch event webpage to fullfill the remaining information
    let todo = 0

    for (let i = 0; i < calendar.events.length; i++) {
      let event = calendar.events[i]
      // Get the course code
      if ("summary" in event) {
        let match = event.summary.match(/\((.*)\)/) || []
        if (match.length > 1)
          event.code = match[1]
      }

      // Get the event url
      if ("description" in event) {
        let index = event.description.indexOf("\\n")
        let url
        if (index >= 0)
          url = event.description.substring(0, index)
        else
          url = event.description
        event.url = url

        todo++

        // Lets fetch the event content and parse it
        executeGet(url)
          .then(webpage => {
            // console.log("webpage",webpage)

            let startIndex = webpage.indexOf("<div class=\"calendarDetails\"")

            let lines = webpage.substring(startIndex + "<div class=\"calendarDetails\"".length).split("\n")
            let endIndex = startIndex
            let open = 1,
              next = undefined
            for (let i = 0; i < lines.length; i++) {
              let trimed = lines[i].trim()
              if (trimed.startsWith("<div")) {
                open++
              } else if (trimed.startsWith("</div")) {
                open--
                if (open == 0) {
                  break
                }
              } else if (trimed.startsWith('<span class="sub-header type" itemprop="eventType">')) {
                let lStart = '<span class="sub-header type" itemprop="eventType">'.length,
                  lEnd = trimed.length - '</span>'.length
                event.type = translation.swToFr[trimed.substring(lStart, lEnd)]
              } else if (lines[i].includes('<span class="sub-header place" itemprop="location">')) {
                next = "location"
              } else if (next == "location" && trimed.length > 1) {
                next = undefined
                try {
                  let lStart = trimed.indexOf('href="') + 'href="'.length,
                    lEnd = trimed.indexOf('"', lStart)
                  event.locationUrl = trimed.substring(lStart, lEnd)
                  lStart = trimed.indexOf('>', lEnd) + 1
                  lEnd = trimed.indexOf("<", lStart)
                  event.location2 = trimed.substring(lStart, lEnd)
                } catch (err) { }
              }
              endIndex += lines[i].length
            }

            //console.log("Updated event",event)
            //console.log("substring=",result)
            todo--
            if (todo <= 0) {
              // Every event webpages have been fetch, resolve
              resolve(calendar)
            }
          })
      }
    }
  })
}

const test = () => {
  console.log("Test running...")
  fetchCalendar()
    .then(raw => {
      saveRawCalendar(raw)
      console.log("Calendar read ok")
      parseRawCalendar(raw)
        .then(calendar => {
          saveParsedCalendar(calendar)
            .then(() => {
              console.log("Parsed calendar saved")
            })
            .catch(error => {
              console.error("Error while saving parsed calendar", error)
            })
        })
        .catch(error => {
          console.error("Error while parsing raw calendar", error)
        })
    })
    .catch(err => {
      console.error(err)
    })
}

const getCalendar = async () => {
  try {
    cal = await getParsedCalendar()
    return cal
  } catch (err) {
    let rawCalendar = await fetchCalendar()
    let parsedCalendar = await parseRawCalendar(rawCalendar)
    let filledCalendar = await appendInformationUsingUrl(parsedCalendar)
    saveParsedCalendar(filledCalendar)
    return filledCalendar
  }
}

const same = (o1, o2, except = []) => {
  let clone1 = { ...o1 },
    clone2 = { ...o2 }

  for (let i = 0; i < except.length; i++) {
    clone1[except[i]] = undefined
    clone2[except[i]] = undefined
  }

  return JSON.stringify(clone1) == JSON.stringify(clone2)
}

const updateCalendar = async (before = undefined) => {
  let raw = await fetchCalendar()
  saveRawCalendar(raw)

  let parsedCalendar = await parseRawCalendar(raw)

  if (before) {
    let toFill = []
    let events = []
    const except = ["code", "url", "type", "location2", "locationUrl"]

    let removedCount = 0, addedCount = 0

    for (let i = 0, j = 0; i < before.events.length && j < parsedCalendar.events.length; i++, j++) {
      let found = false

      let x = j
      for (; x < parsedCalendar.events.length; x++) {
        if (same(before.events[i], parsedCalendar.events[j], except)) {
          found = true
          break
        }
      }

      if (found) {
        for(; j < x; j++){
          // Add new events to toFill
          toFill.push(parsedCalendar.events[i]) 
        }
        if(toFill.length > 0){
          let tmp = {events: toFill}
          appendInformationUsingUrl(tmp)

          for(let a = 0; a < tmp.events.length; a++){
            addedCount++
            events.push(tmp.events[a])
          }

          toFill = []
        }

        events.push(before.events[i])
      } else {
        removedCount++
      }
    }

    before.events = events

    console.log("Updated the calendar, "+removedCount+" events removed and "+addedCount+" events added")

    saveParsedCalendar(before)
    return before
  } else {
    let filledCalendar = await appendInformationUsingUrl(parsedCalendar)
    saveParsedCalendar(filledCalendar)
    return filledCalendar
  }
}

module.exports = {
  fetchCalendar: fetchCalendar,
  parseRawCalendar: parseRawCalendar,
  getCalendar: getCalendar,
  updateCalendar: updateCalendar,

  getRawCalendar: getRawCalendar,
  saveRawCalendar: saveRawCalendar,

  saveParsedCalendar: saveParsedCalendar,
  getParsedCalendar: getParsedCalendar,

  test: test,
}
