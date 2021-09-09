/**
 * Module to build a view of a calendar (well formed)
 * 
 * ** Set to debug mode **
 * CalendarBuilder.debug = true/false
 * 
 */

(() => {
    // Export
    class CalendarBuilder { }

    // Are we debugging the CalendarBuilder module.
    // If so, will print logs
    CalendarBuilder.debug = true

    /**
     * Private method to log some debug messages
     * Will print the message, if debug is on
     * @param  {...any} args messages to print
     */
    const log = (...args) => {
        if (CalendarBuilder.debug) {
            console.log.apply(console, ["<CalendarBuilder>", ...args])
        }
    }

    // Courses to skip (don't show)
    const coursesToSkip = { "DD2257": true } // Vizualisation

    /**
     * Utility function to create a DOM element
     * @param {string} type type of the element/node (example "div","span") 
     * @param {object} options 
     *      * class {string} to set the class (one)
     *      * classes {array<string>} to set several classes 
     *      * children {array<Element>} to set the children of the node
     *      * parent {Element} to set the parent of the node 
     * @returns 
     */
    const _ce = (type, options = {}) => {
        let element = document.createElement(type)
        if (options.class) {
            element.classList.add(options.class)
        } else if (options.classes) {
            options.classes.forEach(c => element.classList.add(c))
        }

        if (options.children) {
            option.children.forEach(child => element.appendChild(child))
        }

        if (options.parent) {
            options.parent.appendChild(element)
        }

        return element
    }

    /**
     * Class to represent an event
     */
    class Event {
        /**
         * 
         * @param {object} params
         *      * startTime {number} Epoch time of the start of the event
         *      * endTime {number} Epoch time of the end of the event
         *      * summary {string} Summary of the event
         *      * type {string} Event type 
         *      * code {string/number} code of the event
         *      * location {string} location description
         *      * location2 {string} alternative location
         *      * locationUrl {string} url of the location
         *      * locationCoordinates {object(lat,lng)} coordinates latitude/longitude of the location
         *      * url {string} url of the event 
         */
        constructor(params) {
            this._baseParams = params

            this.startTime = params.startTime
            this.endTime = params.endTime


            const toMinutes = t => {
                let date = new Date(t)
                return date.getHours() * 60 + date.getMinutes()
            }
            this.start = toMinutes(this.startTime)
            this.end = toMinutes(this.endTime)

            this.summary = params.summary
            this.type = params.type
            this.code = params.code

            this.location = params.location
            this.location2 = params.location2
            this.locationUrl = params.locationUrl
            this.locationCoordinates = params.locationCoordinates
            this.url = params.url
        }

        /**
         * @returns start hour text formated as HH:MM 
         */
        startHourText() {
            if (!this._startHourText) {
                let date = new Date(this.startTime)
                let _ = i => i < 10 ? "0" + i : "" + i
                this._startHourText = _(date.getHours()) + ":" + _(date.getMinutes())
            }
            return this._startHourText
        }

        /**
         * @returns end hour text formated as HH:MM 
         */
        endHourText() {
            if (!this._endHourText) {
                let date = new Date(this.endTime)
                let _ = i => i < 10 ? "0" + i : "" + i
                this._endHourText = _(date.getHours()) + ":" + _(date.getMinutes())
            }
            return this._endHourText
        }

        /**
         * @returns Summary, without the code in it
         */
        summaryWithoutCode() {
            if (!this._summaryWithoutCode) {
                let index = this.summary.lastIndexOf("(")
                if (index > 0) {
                    this._summaryWithoutCode = this.summary.substring(0, index - 1).trim()
                } else {
                    this._summaryWithoutCode = this.summary
                }
            }
            return this._summaryWithoutCode
        }

        /**
         * @returns location string, built from location and location2 values 
         */
        locationText() {
            if (!this._locationText) {
                if (this.location2 && this.location != this.location2) {
                    this._locationText = this.location + " (" + this.location2 + ")"
                } else {
                    this._locationText = this.location
                }
                this._locationText = this._locationText.replaceAll("\\", "")
            }
            return this._locationText
        }

        /**
         * Main function of this class: Build the DOM element describing the event
         * Contains description, location, links...
         * @returns {Element} Element to include into the page
         */
        buildContent() {
            // Main container
            let mainContainer = _ce("div")

            let mainHTML = ""

            mainHTML += "<b>" + this.summaryWithoutCode() + "</b><br>"

            // Append type and/or code
            if (this.type) {
                mainHTML += `<i>${this.type}</i>`
                if (this.code) {
                    mainHTML += " - " + this.code
                }
                mainHTML += "<br>"
            } else if (this.code) {
                mainHTML += this.code + "<br>"
            }

            // Append location, with URL if possible
            if (this.location) {
                if (this.locationUrl) {
                    mainHTML += '<a href="' + this.locationUrl + '">' + this.locationText() + "</a>"
                } else {
                    mainHTML += this.locationText()
                }

                if (this.locationCoordinates) {
                    mainHTML += ' <button onclick="displayLocation(' + this.locationCoordinates.lat + ',' + this.locationCoordinates.lng + ')">Display location</button>'
                }

                mainHTML += "<br>"
            }

            // Append official url of event 
            if (this.url) {
                mainHTML += `<a href="${this.url}">Description</a><br>`
            }

            mainContainer.innerHTML = mainHTML

            return mainContainer
        }
    }

    /**
     * Class to build the HTML elements for displaying a day 
     */
    class DayBuilder {
        /**
         * Constructor
         * @param {Date} day day for which we are building the elements 
         * @param {Array<Event>} events events happening that day 
         */
        constructor(day, events) {
            this.day = day
            this.events = events
        }

        /**
         * @param {number} time time in milliseconds since epoch 
         * @returns {number} time in minutes since last 00:00
         */
        _toMinutes(time) {
            let date = new date(time)
            return date.getHours() * 60 + date.getMinutes()
        }

        /**
         * Find the important hours of the days.
         * An important hour is the start or the end of an event 
         * @param {Array<Event>} events events to iterrate through 
         * @returns {Array<number>} sorted array of the important hours
         */
        _findHours(events) {
            let hoursMap = {}
            events.forEach(event => {
                hoursMap[event.start] = true
                hoursMap[event.end] = true
            })
            let hours = Object.keys(hoursMap)
                .sort((a, b) => {
                    return a - b
                })
            return hours
        }

        /**
         * @param {numer} time in minutes since last 00:00 
         * @returns {string} formated text as HH:MM
         */
        _hoursString(time) {
            let _ = i => i < 10 ? "0" + i : "" + i
            return _((time / 60).toFixed(0)) + ":" + _(time % 60)
        }

        /**
         * Place the events into columns, so that overlaping events are not in the same column
         * @param {Array<Event>} events events to place 
         * @returns {Array<Column>} columns 
         */
        _placeIntoColumns(events) {
            let cols = []

            cols.push({
                start: -1,
                end: -1,
                events: []
            })

            events.forEach(event => {
                let placed = false
                for (let i = 0; i < cols.length; i++) {
                    let column = cols[i]
                    if (column.start == -1) {
                        // No start: first event of the col
                        column.start = event.start
                        placed = true
                    } else if (column.end <= event.start) {
                        // Place after the last added event
                        placed = true
                    }
                    if (placed) {
                        column.end = event.end
                        column.events.push(event)
                        event._col = i
                        break
                    }
                }
                if (!placed) {
                    // No place into the existing columns: add another one
                    event._col = cols.length
                    cols.push({
                        start: event.start,
                        end: event.end,
                        events: [event]
                    })
                }

            })

            return cols
        }

        /**
         * Find the row and the row span for an event (with a start time and an end time)
         * @param {Array<number>} hours important hours, sorted, in minutes since last 00:00 
         * @param {number} start start time of the event, in minutes since last 00:00
         * @param {numer} end end time of the event, in minutes since last 00:00 
         * @returns {object(row, rowSpan)} object containing the row index as `row`, and the row span as `rowSpan`
         */
        _findRowAndSpan(hours, start, end) {
            let row = 0, span = 1
            while (row < hours.length && hours[row] < start)
                row++
            while (row + span < hours.length && hours[row + span] < end)
                span++
            return {
                row: row,
                rowSpan: span
            }
        }

        /**
         * Find the column span for an event (with a start time and an end time)
         * @param {Array<Column>} columns columns containing events 
         * @param {number} index index of the column of the event (in columns array) 
         * @param {number} start start time of the event, in minutes since last 00:00 
         * @param {number} end end time of the event, in minutes since last 00:00
         * @returns {number} column span 
         */
        _findColSpan(columns, index, start, end) {
            const ok = event => {
                return start >= event.start || end <= event.end
            }
            const colOk = col => {
                for (let i = 0; i < col.events.length; i++)
                    if (!ok(col.events[i]))
                        return false
                return true
            }

            let span = 1
            while (span + index < columns.length && colOk(columns[span + index]))
                span++

            return span
        }

        /**
         * Build a 2 dimensions array usable to display correctly the events
         * @param {Array<Event>} events events to display 
         * @param {Array<number>} hours sorted array of the important hours 
         * @param {Array<Column>} columns array of the columns, containing events  
         * @returns {Array<Array<Event?>>} Cells of the table, organized as an array of row, itslef an array of cells.
         */
        _buildCells(events, hours, columns) {
            let cells = []
            for (let i = 0; i < hours.length - 1; i++) {
                let row = []
                for (let j = 0; j < columns.length; j++)
                    row.push("empty")
                cells.push(row)
            }

            events.forEach(event => {
                let rowData = this._findRowAndSpan(hours, event.start, event.end)
                event._row = rowData.row
                event.rowSpan = rowData.rowSpan
                event.colSpan = this._findColSpan(event._col, event.start, event.end)

                cells[rowData.row][event._col] = event
                for (let i = 1; i < event.rowSpan; i++) {
                    for (let j = 0; j < event.colSpan; j++) {
                        cells[rowData.row + i][event._col + j] = undefined
                    }
                }

                for (let i = 1; i < event.colSpan; i++) {
                    cells[rowData.row][event._col + i] = undefined
                }
            })

            return cells
        }

        /**
         * Build the dom elements corresponding to the day and the events
         * @returns {Element} element to include to the page are representing the days 
         */
        build() {
            log("DayBuilder, request to build for day" + this.day + ", and events", this.events)

            // Variables
            let hours = this._findHours(this.events)

            let columns = this._placeIntoColumns(this.events)

            let cells = this._buildCells(this.events, hours, columns)

            // Container
            let mainContainer = _ce("div", {
                class: "day"
            })

            let nextDay = new Date(this.day)
            nextDay.setDate(nextDay.getDate() + 1);

            if(nextDay.getTime() < (new Date()).getTime()){
                mainContainer.classList.add("done")
            }

            // Header displaying the date
            let header = _ce("div", {
                class: "header",
                parent: mainContainer
            })
            header.innerText = formatDayDate(this.day)

            // Coures container (table)
            let coursesContainer = _ce("table", {
                class: "courses-container",
                parent: mainContainer
            })

            // Function to create and add an empty row, starting by displaying the in-param time
            let emptyHourRow = time => {
                let row = _ce("tr", { parent: coursesContainer })
                let cell = _ce("td", { parent: row, class: "hour" })
                cell.innerText = this._hoursString(time)
                return row
            }

            // First row: empty
            let hoursIndex = 0
            emptyHourRow(hours[0])

            cells.forEach(row => {
                let hour = -1

                let tds = []
                row.forEach(cell => {
                    if (cell) {
                        let cellElement = _ce("td")
                        if (cell == "empty") {
                            cellElement.classList.add("empty-cell")
                        } else if (cell) {
                            cellElement.classList.add("course")
                            hour = cell.start
                            cellElement.style.height = "100%"
                            cellElement.appendChild(cell.buildContent())
                            cellElement.rowSpan = cell.rowSpan
                            cellElement.colSpan = cell.colSpan
                        }
                        tds.push(cellElement)
                    } // If the cell is undefined: don't add it
                })
                if (hour == -1 && hoursIndex < hours.length - 1) {
                    // A really empty row
                    emptyHourRow(hours[++hoursIndex])
                } else {
                    // Add missed rows
                    while (hour > hours[hoursIndex]) {
                        emptyHourRow(hours[++hoursIndex])
                    }

                    // Add current row
                    let row = emptyHourRow(hours[++hoursIndex])

                    tds.forEach(td => { row.appendChild(td) })
                    coursesContainer.appendChild(row)
                }
            })

            return mainContainer
        }
    }


    /**
     * Find the day of the event
     * @param {Object} event 
     * @returns {Date} date of the event, at 00:00:00
     */
    const dayOf = event => {
        let day = new Date(event.startTime)
        day.setHours(0)
        day.setMinutes(0)
        day.setSeconds(0)
        day.setMilliseconds(0)
        return day
    }

    /**
     * Format a date in a day (dd/mm) format
     * @param {Date} date 
     * @returns {String} formated string
     */
    const formatDayDate = date => {
        const _ = i => i < 10 ? "0" + i : "" + i
        const days = [
            "Dimanche",
            "Lundi", "Mardi", "Mercredi",
            "Jeudi", "Vendredi", "Samedi"
        ]

        date = new Date(date)
        return days[date.getDay()] + " " + _(date.getDate()) + "/" + _(date.getMonth() + 1)
    }


     /**
     * Set the calendar events to display on the webpage
     * @param {Array<Object>} events event list  
     */
    CalendarBuilder.setEvents = events => {
        console.log("setEvents3")
        // Create main div
        let main = _ce("div", { class: "calendar" })

        let body = document.querySelector("body")

        // Remove existing main if exists
        let currentMain = body.querySelector(".calendar")
        if (currentMain) {
            body.removeChild(currentMain)
        }

        body.appendChild(main)

        // Day currently computed 
        let currentDay = undefined
        let currentEvents = []

        // Today's date
        const today = new Date()

        let elementToScroll = undefined

        let eventsDone = 0,
            eventsCount = 0;

        for (let i = 0; i < events.length; i++) {
            let event = events[i]

            // Skip useless events 
            if (event.code && event.code in coursesToSkip) {
                continue
            }

            // Create a day header if the day has changed
            if (!currentDay || dayOf(event).getTime() != currentDay.getTime()) {
                // Create day element
                if (currentEvents.length > 0) {
                    let dayElement = new DayBuilder(currentDay, currentEvents).build()
                    main.appendChild(dayElement)
                    currentEvents = []

                    if (dayOf(event).getTime() > today.getTime() && !elementToScroll) {
                        // The next day will be after now
                        elementToScroll = dayElement
                    }
                }

                currentDay = dayOf(event)
            }
            currentEvents.push(new Event(event))
            eventsCount++

            if (today.getTime() > new Date(event.endTime).getTime()) {
                // The event is finished
                eventsDone++
            }
        }

        if (elementToScroll)
            scrollTo(0, elementToScroll.offsetTop)

        return {
            done: eventsDone,
            total: eventsCount
        }
    }


    window["CalendarBuilder"] = CalendarBuilder
})()

/**
 * Display the map dialog with the matching location
 * @param {number} lat latitude 
 * @param {number} lng longitude 
 */
function displayLocation(lat, lng) {
    let map = document.querySelector("#map-dialog")
    map.style.display = "block"
    map.firstElementChild.src = "https://maps.google.com/maps?q=" + lat + "," + lng + "&zoom=20&ie=UTF8&output=embed&iwloc=&iwd=0"

}