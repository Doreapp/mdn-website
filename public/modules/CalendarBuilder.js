/**
 * Module to build a view of a calendar (well formed)
 */

(() => {
    // Export
    class CalendarBuilder { }

    const coursesToSkip = { "DD2257": true } // Vizualisation

    /**
     * Build and HTML string displaying the information related to the input event
     * @param {Object} event  
     * @returns {String} HTML String, that can be placed into an "innerHTML" attribute
     */
     const buildContent2 = event => {
        const _ = i => i < 10 ? "0"+i : ""+i
        const dateStr = time => {
            let date = new Date(time)
            return _(date.getHours()) + ":" + _(date.getMinutes())
        }

        let str = ""
        str += "<table><tr><td class=\"start-hour\">"
        str += dateStr(event.startTime)
        str += "</td>"
        str += "<td class=\"content\" rowspan=\"2\">"

        // Remove the code from the course summary, place at the end of the text, between parenthesis
        let summary = event.summary,
            index = summary.lastIndexOf("(")
        if (index >= 0) {
            summary = summary.substring(0, index).trim()
        }

        str += "<b>" + summary + "</b><br>"

        // Append type and/or code
        if (event.type) {
            str += `<i>${event.type}</i>`
            if (event.code) {
                str += " - " + event.code
            }
            str += "<br>"
        } else if (event.code) {
            str += event.code + "<br>"
        }

        // Append location, with URL if possible
        if (event.location) {
            let location = event.location
            if (event.location2 && event.location2 != event.location) {
                location += " (" + event.location2 + ")"
            }
            location = location.replaceAll("\\", "")
            if (event.locationUrl) {
                str += '<a href="' + event.locationUrl + '">' + location + "</a>"
            } else {
                str += location
            }

            if (event.locationCoordinates) {
                str += ' <button onclick="displayLocation(' + event.locationCoordinates.lat + ',' + event.locationCoordinates.lng + ')">Display location</button>'
            }

            str += "<br>"
        }

        // Append official url of event 
        if (event.url) {
            str += `<a href="${event.url}">Description</a><br>`
        }

        str += "</td></tr>"
        str += '<tr><td class="end-hour">'
        str += dateStr(event.endTime)
        str += "</td></tr>"

        str += "</table>"

        return str
    }

    const buildDay = (day, events) => {
        const t = date => date.getHours() * 60 + date.getMinutes()

        let cols = []

        cols.push({
            start: -1,
            end: -1,
            events: []
        })

        let dayStart = 24*60, dayEnd = 0

        events.forEach(event => {
            let start = t(new Date(event.startTime))
            let end = t(new Date(event.endTime))

            let placed = false
            for (let i = 0; i < cols.length; i++) {
                let column = cols[i]
                if (column.start == -1) {
                    // No start: first event of the col
                    column.start = start
                    column.end = end
                    column.events.push(event)
                    placed = true
                    break
                } else if (column.end <= start) {
                    // Place after the last added event
                    column.end = end
                    column.events.push(event)
                    placed = true
                    break
                }
            }
            if (!placed) {
                // No place into the existing columns: add another one
                cols.push({
                    start: start,
                    end: end,
                    events: [event]
                })
            }

            dayStart = dayStart > start ? start : dayStart
            dayEnd = dayEnd < end ? end : dayEnd
        })

        console.log("For events ", events, cols, "from "+dayStart/60+" to "+dayEnd/60)

        let main = document.createElement("div")
        main.classList.add("day")

        let header = document.createElement("div")
        header.classList.add("header")
        header.innerText = formatDayDate(day)
        main.appendChild(header)

        // Courses container
        let coursesContainer = document.createElement("div")
        coursesContainer.classList.add("courses-container")
        coursesContainer.style.display = "flex";
        main.appendChild(coursesContainer)

        cols.forEach(column => {
            let element = document.createElement("div")
            element.style.flex = 1
            element.style.display = "flex"
            element.style.flexDirection = "column"
            

            if(column.start > dayStart){
                // Need an empty cell
                let spaceElement = document.createElement("div")
                spaceElement.style.flex = (column.start - dayStart)/(dayEnd - dayStart)
                element.appendChild(spaceElement)
            } 

            let lastEnd = column.start
            column.events.forEach(event => {
                let eventStart = t(new Date(event.startTime))
                let eventEnd = t(new Date(event.endTime))

                if(eventStart > lastEnd){
                    // Need an empty cell
                    let spaceElement = document.createElement("div")
                    spaceElement.style.flex = (eventStart - lastEnd)/(dayEnd - dayStart)
                    element.appendChild(spaceElement)
                } 

                let eventElement = document.createElement("div")
                eventElement.classList.add("event")
                eventElement.style.flex = (eventEnd - eventStart)/(dayEnd - dayStart)
                eventElement.innerHTML = buildContent2(event)
                element.appendChild(eventElement)

                lastEnd = eventEnd
            })
            
            if(lastEnd < dayEnd){
                // Need an empty cell
                let spaceElement = document.createElement("div")
                spaceElement.flex = (dayEnd - lastEnd)/(dayEnd - dayStart)
                element.appendChild(spaceElement)
            } 
        
            coursesContainer.appendChild(element)
        })

        return main
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
     * Build and HTML string displaying the information related to the input event
     * @param {Object} event  
     * @returns {String} HTML String, that can be placed into an "innerHTML" attribute
     */
    const buildContent = event => {
        let str = ""

        // Remove the code from the course summary, place at the end of the text, between parenthesis
        let summary = event.summary,
            index = summary.lastIndexOf("(")
        if (index >= 0) {
            summary = summary.substring(0, index).trim()
        }

        str += "<b>" + summary + "</b><br>"

        // Append type and/or code
        if (event.type) {
            str += `<i>${event.type}</i>`
            if (event.code) {
                str += " - " + event.code
            }
            str += "<br>"
        } else if (event.code) {
            str += event.code + "<br>"
        }

        // Append location, with URL if possible
        if (event.location) {
            let location = event.location
            if (event.location2 && event.location2 != event.location) {
                location += " (" + event.location2 + ")"
            }
            location = location.replaceAll("\\", "")
            if (event.locationUrl) {
                str += '<a href="' + event.locationUrl + '">' + location + "</a>"
            } else {
                str += location
            }

            if (event.locationCoordinates) {
                str += ' <button onclick="displayLocation(' + event.locationCoordinates.lat + ',' + event.locationCoordinates.lng + ')">Display location</button>'
            }

            str += "<br>"
        }

        // Append official url of event 
        if (event.url) {
            str += `<a href="${event.url}">Description</a><br>`
        }

        return str
    }


    CalendarBuilder.setEvents2 = events => {
        console.log("setEvents2")
        // Create main div
        let main = document.createElement("div")
        main.classList.add("calendar")

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

        let currentDayHeader = undefined
        let elementToScroll = undefined
        let pair = true

        let eventsDone = 0, eventsCount = 0;

        for (let i = 0; i < events.length; i++) {
            let event = events[i]

            // Skip useless events 
            if (event.code && event.code in coursesToSkip) {
                continue
            }

            // Create a day header if the day has changed
            if (!currentDay || dayOf(event).getTime() != currentDay.getTime()) {
                // Create day element
                if(currentEvents.length > 0){
                    body.appendChild(buildDay(currentDay, currentEvents))
                    currentEvents = []
                }

                currentDay = dayOf(event)
            }
            currentEvents.push(event)
            eventsCount++
        }

        if (elementToScroll)
            scrollTo(0, elementToScroll.offsetTop)

        return {
            done: eventsDone,
            total: eventsCount
        }
    }

    /**
     * Set the calendar events to display on the webpage
     * @param {Array<Object>} events event list  
     */
    CalendarBuilder.setEvents = (events) => {
        // Create main table
        let table = document.createElement("table")
        table.classList.add("calendar")

        let body = document.querySelector("body")

        let currentTable = body.querySelector(".calendar")
        if (currentTable) {
            body.removeChild(currentTable)
        }

        body.appendChild(table)

        // Day currently computed 
        let currentDay = undefined

        // Today's date
        const today = new Date()

        let currentDayHeader = undefined
        let elementToScroll = undefined
        let pair = true

        let eventsDone = 0, eventsCount = 0;

        for (let i = 0; i < events.length; i++) {
            let event = events[i]

            if (event.code && event.code in coursesToSkip) {
                continue
            }

            // Create a day header if the day has changed
            if (!currentDay || dayOf(event).getTime() != currentDay.getTime()) {
                currentDay = dayOf(event)

                // A line
                let line = document.createElement("tr")
                line.classList.add("line-up")
                let lineContent = document.createElement("td")
                lineContent.colSpan = 2
                line.appendChild(lineContent)
                table.appendChild(line)

                // A row with the day in it, surrounded by lines
                let dayTitle = document.createElement("tr")
                dayTitle.classList.add("line-up")
                dayTitle.classList.add("line-down")
                let dayTitleCell = document.createElement("td")
                dayTitleCell.colSpan = 2
                dayTitleCell.classList.add("day")
                dayTitle.appendChild(dayTitleCell)
                dayTitleCell.innerText = formatDayDate(currentDay)

                currentDayHeader = dayTitle

                table.appendChild(dayTitle)
            }

            // Format a number with at least tow digits (add a leading 0 if needed)
            const _ = i => i < 10 ? "0" + i : "" + i

            // Row of the event 
            let mainRow = document.createElement("tr")
            mainRow.classList.add(pair ? "pair" : "odd") // Used to change the background color

            // Start hour cell
            let hourCell = document.createElement("td")
            hourCell.classList.add("start-hour")
            mainRow.appendChild(hourCell)
            const startTime = new Date(event.startTime)
            hourCell.innerText = _(startTime.getHours()) + ":" + _(startTime.getMinutes())

            // Main cell, containing event description
            let mainCell = document.createElement("td")
            mainRow.appendChild(mainCell)
            mainCell.rowSpan = 2
            mainCell.innerHTML = buildContent(event)

            table.appendChild(mainRow)

            // End hour: needs a row and a cell
            let endHourRow = document.createElement("tr")
            endHourRow.classList.add(pair ? "pair" : "odd")
            let endHourCell = document.createElement("td")
            endHourCell.classList.add("end-hour")
            endHourRow.appendChild(endHourCell)
            const endTime = new Date(event.endTime)
            endHourCell.innerText = _(endTime.getHours()) + ":" + _(endTime.getMinutes())
            table.appendChild(endHourRow)

            if (today.getTime() > endTime.getTime()) {
                // The event is finished
                mainRow.classList.add("done")
                endHourRow.classList.add("done")
                eventsDone++
            } else if (!elementToScroll) {
                elementToScroll = currentDayHeader
            }

            eventsCount++
            pair = !pair
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