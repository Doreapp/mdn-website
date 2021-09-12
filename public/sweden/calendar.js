(() => {
    const _qs = query => {
        return document.querySelector(query)
    }

    const setProgress = (done, total) => {
        let todo = total - done
        _qs("#progress-absolute").innerText = done + "/" + total
        _qs("#progress-relative").innerText = (done * 100 / total).toFixed(1) + "%"
        _qs("#progress-done").style.flex = done
        _qs("#progress-todo").style.flex = todo
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