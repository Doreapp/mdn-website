(() => {
    const buildEventElement = event => {
        const _c = (name, parent = undefined) => {
            let res = document.createElement(name)
            if (parent)
                parent.appendChild(res)
            return res
        }
        let container = _c("div")
        container.classList.add("event")
        container.classList.add("container")

        let title = _c("h2", container)
        title.innerText = event.summary

        let list = _c("ul", container)
        if (event.type) {
            let itemType = _c("li", list)
            itemType.innerText = event.type
        }

        if(event.location) {
            let text = event.location
            if(event.location2 && event.location2 != event.location){
                text += " ("+event.location2+")"
            }
            let itemLocation = _c("li", list)
            if(event.locationUrl){
                let linkLocation = _c("a", itemLocation)
                linkLocation.href = event.locationUrl
                linkLocation.innerText = text
            } else {
                itemLocation.innerText = text
            }
        }

        return container
    }

    console.log("Start")

    socket = io.connect("/calendar")

    let calendar = undefined
    socket.on("calendar", cal => {
        calendar = cal

        CalendarBuilder.setEvents(cal.events)

        /*const body = document.querySelector("body")
        for(let i = 0; i < cal.events.length; i++){
            let div = buildEventElement(cal.events[i])
            body.appendChild(div)
        }*/
    })
})()