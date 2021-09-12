/********************************
 * 
 * Package Mdn
 * 
 * - At the beginning
 * Mdn.init()
 * 
 * - To debug
 * Mdn.debug = true
 * 
 ********************************/

(() => {
    class Mdn { }

    Mdn.debug = true

    const log = (...args) => {
        if (Mdn.debug)
            console.log.apply(console, ["Mdn-Debug", ...args])
    }

    const warn = message => {
        console.warn("Mdn: "+message)
    }

    const qs = query => {
        return document.querySelector(query)
    }
    
    const qsa = query => {
        return document.querySelectorAll(query)
    }

    Mdn.include = (element, source) => {
        log("Include",element,source)
        fetch(source)
            .then(response => {
                response.text()
                    .then(html => {
                        log("Fetch response from "+source)
                        let tmp = document.createElement("div")
                        tmp.innerHTML = html
                        element.replaceWith(tmp.firstChild)
                    })
                    .catch(error => {
                        warn("Unable to read file at "+source+" (as html")
                        log("Fetch for "+source+" unable to read", error)
                    })
            })
            .catch(error => {
                warn("Impossible to fetch "+source)
                log("Fetch failed for "+source, error)
            })
    }

    Mdn.init = () => {
        log("test",4)
        log("Init")

        const includeNodes = qsa("mdn-include")
        includeNodes.forEach(node => {
            if(node.attributes.src) {
                Mdn.include(node, node.attributes.src.value )
            } else {
                warn("Node mdn-include doesn't contain src attribute.")
                log("Problematic node",node)
            }
        })
    }

    Mdn.apiCall = (domain, request, args={}) => {
        log("API call to "+domain+" for "+request, args)
        return new Promise((resolve, reject) => {
            let url = '/'+domain+"/api/"+"?command="+request
            //TODO handle args
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", url, false ); // false for synchronous request
            xmlHttp.send( null );
            resolve(JSON.parse(xmlHttp.responseText))
        })
    }

    window["Mdn"]=Mdn
})()