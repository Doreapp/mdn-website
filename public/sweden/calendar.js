(() => {
    const _qs = query => {
        return document.querySelector(query)
    }

    const setProgress = (done, total) => {
        let todo = total-done
        _qs("#progress-absolute").innerText = done+"/"+total
        _qs("#progress-relative").innerText = (done*100/total).toFixed(1) + "%"
        _qs("#progress-done").style.flex = done
        _qs("#progress-todo").style.flex = todo
    }

    socket = io.connect("/calendar")

    let calendar = undefined
    socket.on("calendar", cal => {
        calendar = cal

        console.log("Calendar: ",calendar)

        let stats = CalendarBuilder.setEvents(cal.events)
        _qs("#btn-reload").disabled = false

        setProgress(stats.done, stats.total)
    })

    document.querySelector("#btn-reload").onclick = event => {
        console.log("Ask for reload")
        socket.emit("reload")
        event.target.disabled = true
    }

    // Initialize Mdn library
    Mdn.init()
})()