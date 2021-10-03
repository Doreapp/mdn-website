const fs = require('fs'),
    path = require("path");

function loadPackageByName(name, app) {
    try {
        module = require(path.join(__dirname, "packages", name))
        module.main(app)
        return true 
    } catch (error) {
        console.log("PackagesLoader: Unable to load package '"+name+"'", error)
        return false
    }
}

module.exports = {
    load: app => {
        fs.readFile(path.join(__dirname, "/packages/packages.json"), (err, data) => {
            if(err) {
                console.log("PackagesLoader: Unable to list packages.")
                return
            }

            try {
                let packagesList = JSON.parse(data)
                let total = 0, loaded = 0

                packagesList.forEach(package => {
                    total++
                    let success = loadPackageByName(package, app)
                    if (success) loaded++
                })

                console.log("PackagesLoader: "+loaded+"/"+total+" packages loaded")
            } catch(error) {
                console.log("PackagesLoader: Unable to read packages.json", error)
            }
        })
    }
}