(() => {
    const _qs = query => {
        return document.querySelector(query)
    }

    const setProgress = (done, total) => {
        Mdn.progressBars[0].setProgress(done, total)
    }

    Mdn.apiCall("sweden", "getCalendar")
        .then(calendar => {
            console.log("Calendar: ", calendar)

            let stats = CalendarBuilder.setEvents(calendar.events)
            _qs("#btn-reload").disabled = false

            setProgress(stats.done, stats.total)
        })

    document.querySelector("#btn-reload").onclick = event => {
        console.log("Ask for reload")
        Mdn.apiCall("sweden", "updateCalendar")
            .then(calendar => {
                console.log("updated Calendar: ", calendar)

                let stats = CalendarBuilder.setEvents(calendar.events)
                event.target.disabled = true

                setProgress(stats.done, stats.total)
            })
        event.target.disabled = true
    }

    // Initialize Mdn library
    Mdn.init()
})()