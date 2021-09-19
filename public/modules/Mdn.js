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
    class Mdn {}

    // Are we debugging
    Mdn.debug = true

    // Log, if debugging
    const log = (...args) => {
        if (Mdn.debug)
            console.log.apply(console, ["Mdn-Debug", ...args])
    }

    // Warning message
    const warn = message => {
        console.warn("Mdn: " + message)
    }

    // Quick query selector
    const qs = query => {
        return document.querySelector(query)
    }

    // Quick query selector all
    const qsa = query => {
        return document.querySelectorAll(query)
    }

    /**
     * Include an html file (source) into the webpage, replacing {element}
     * @param {Element} element element to replace 
     * @param {string} source location of the html to fetch and use  
     */
    Mdn.include = (element, source) => {
        log("Include", element, source)
        fetch(source)
            .then(response => {
                response.text()
                    .then(html => {
                        log("Fetch response from " + source)
                        let tmp = document.createElement("div")
                        tmp.innerHTML = html
                        element.replaceWith(tmp.firstChild)
                    })
                    .catch(error => {
                        warn("Unable to read file at " + source + " (as html")
                        log("Fetch for " + source + " unable to read", error)
                    })
            })
            .catch(error => {
                warn("Impossible to fetch " + source)
                log("Fetch failed for " + source, error)
            })
    }

    /**
     * Class to manage a progress bar
     */
    class ProgressBar {
        constructor(element) {
            this.element = element
        }

        /**
         * Set the progress of the progress bar
         * @param {number} done value/count "done" 
         * @param {number} total value/count total  
         */
        setProgress(done, total) {
            let todo = total - done
            this.element.querySelector(".mdn-progress-absolute").innerText = done + "/" + total
            this.element.querySelector(".mdn-progress-relative").innerText = (done * 100 / total).toFixed(1) + "%"
            this.element.querySelector(".mdn-progress-done").style.flex = done
            this.element.querySelector(".mdn-progress-todo").style.flex = todo
        }
    }

    // progress bars array 
    Mdn.progressBars = []

    /**
     * Initialize the element as a progress bar (<mdn-progress-bar> element)
     * @param {Element} element DOM element, mdn-progress-bar, replaced by a progress bar 
     */
    Mdn.progressBar = (element) => {
        log("Initialiae progress bar on", element)
        let div = document.createElement('div')
        div.classList.add('mdn-progress-container')
        div.innerHTML = '<p class="mdn-progress-absolute">0/0</p><div class="mdn-progress-bar"><div class="mdn-progress-done"></div><div class="mdn-progress-todo"></div></div><p class="mdn-progress-relative">0.0%</p>'
        let bar = new ProgressBar(div)
        if (element.id) {
            div.id = element.id
            Mdn.progressBars[element.id] = bar
        }
        Mdn.progressBars.push(bar)
        element.replaceWith(div)
    }

    /**
     * Initialize Mdn module, handling <mdn-*> elements
     */
    Mdn.init = () => {
        log("Init")

        const includeNodes = qsa("mdn-include")
        includeNodes.forEach(node => {
            if (node.attributes.src) {
                Mdn.include(node, node.attributes.src.value)
            } else {
                warn("Node mdn-include doesn't contain src attribute.")
                log("Problematic node", node)
            }
        })

        const progressBars = qsa("mdn-progress-bar")
        progressBars.forEach(bar => Mdn.progressBar(bar))
    }

    Mdn.apiCall = (domain, request, args = {}) => {
        log("API call to " + domain + " for " + request, args)
        return new Promise((resolve, reject) => {
            let url = '/' + domain + "/api/" + "?command=" + request
                //TODO handle args
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", url, false); // false for synchronous request
            xmlHttp.send(null);
            resolve(JSON.parse(xmlHttp.responseText))
        })
    }

    window["Mdn"] = Mdn
})()