const https = require('https'),
  fs = require('fs'),
  path = require("path"),
  Logger = require("./Logger.js")


// Files
const cacheFolder = path.join(__dirname, ".cache"), // Main cache folder
  imagesFolder = path.join(cacheFolder, "images") // images folder

// Calendar URL
const URL = "https://www.instagram.com/tonio_in_sweden/"

/**
 * Execute a HTTPS GET request. 
 * Provide the return 
 * @param {string} url URL to fetch 
 * @returns Promise, when fullfiled, provide the request response content (body)
 */
const executeGet = (url) => {
  console.log("GET " + url)
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
const fetchInstagram = (url = URL) => {
  console.log("Fetch Instagram page")
  Logger.log("InstagramScrapper", "Fetching instagram profile at url " + url)
  return executeGet(url)
}

const test = () => {
  console.log("Instagram scrapper test start.")

  fetchInstagram()
    .then(result => {
      console.log("Result from fetch: ",result)
    })
    .catch(err => {
      console.error("Error fetching instagram", err)
    })
}

module.exports = {
  test: test,
}