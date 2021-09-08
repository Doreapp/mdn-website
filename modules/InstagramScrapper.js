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
        //console.log(res)

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

        res.on('error', err => {
          reject(err)
        });
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

const parseInstagramProfile = html => {
  console.log("parse html", html)
  Logger.log("InstagramScrapper", "Parsing instagram profile")

  let result = {}

  // Get <meta content="73 Followers, 64 Following, 9 Posts - See Instagram photos and videos from @tonio_in_sweden" name="description" />
  let regex = /<meta content="[a-zA-Z0-9,.\-/@^&_]" name="description"/
  let matches = html.match(regex)

  if (matches) {
    console.log("Meta parsed ", matches)

  }

}

const test = () => {
  console.log("Instagram scrapper test start.")

  fetchInstagram("https://www.instagram.com/olivierclaye/")
    .then(result => {
      console.log("Result from fetch: ", result)
      fs.writeFileSync(path.join(__dirname, "insta.html"), result)

      parseInstagramProfile(result)
    })
    .catch(err => {
      console.error("Error fetching instagram", err)
    })

  /*
executeGet("https://www.instagram.com/p/CTKg0bSsHiO/")
  .then(result => {
    console.log("Result from post fetch")
    fs.writeFileSync(path.join(__dirname, "post.html"), result)

    let index = result.indexOf("window._sharedData =")
    if(index > 0){
      let end = result.indexOf("</script", index)-1
      if(end > 0){
        let json = result.substring(index + "window._sharedData =".length, end)
        console.log("Writing json")
        fs.writeFileSync(path.join(__dirname, "post.json"), json)

        let object = JSON.parse(json)

        let regex = /"display_url": ?"(https:\/\/[a-zA-Z0-9:?_.=\-/\\]+)",/g

        matches = json.match(regex)

        if(matches)
          matches.forEach(match => {
            let url = match.substring('"display_url":"'.length, match.length -2)
            
            let decoded = JSON.parse('"'+url+'"')
            console.log(decoded)
          })
      }
    }
  })
  .catch(err => {
    console.error("Error fetching instagram post", err)
  })
  */
}

module.exports = {
  test: test,
}

//test()

loginPost = "username=tonio_in_sweden&enc_password=%23PWD_INSTAGRAM_BROWSER%3A10%3A1631003567%3AAfxQABW2DcHBz%2BgYNqpT1e3162CEJlGuEz3pUTKMHasbWWtS3JLp16mm0%2FmNxjOHcrH1Csap7jQNgf6iawaPSsJ8cjf1Yy9BS0VajfSzF8fHHAX9qlGGsVyRsweqFgcPxQcWrtsymSrw9eKDXPzb2i4v8y%2B%2BkR6KZg%3D%3D&queryParams=%7B%7D&optIntoOneTap=false&stopDeletionNonce=&trustedDeviceRecords=%7B%7D"
//https://www.instagram.com/accounts/login/ajax/

const req = https.request("https://www.instagram.com/accounts/login/ajax/",
  {
    port: 443,
    method: 'POST',  
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginPost.length
    }
  }, res => {
    //console.log(res)

    // Read the content (body)
    let result = ""

    res.on('data', data => {
      // Fill the buffer
      result += data.toString()
    })

    res.on('end', () => {
      // Resolve the promise
      console.log("success",result)
    })

    res.on('error', err => {
      console.error("err",err)
    });
  })

req.on('error', error => {
  console.error("err",error)
})

req.write(loginPost)
req.end()


/*
https://www.instagram.com/data/shared_data/
  JSON
    profile_pic_url
    profile_pic_url_hd

profile page
  HTML
    <meta content="73 Followers, 64 Following, 9 Posts - See Instagram photos and videos from @tonio_in_sweden" name="description" />
    "shortcode":"..."
      --> /p/...

          HTML
            <title>@tonio_in_sweden posted on Instagram • Aug 29, 2021 at 4:01pm UTC</title>

            <meta property="og:description" content="23 Likes, 0 Comments - @tonio_in_sweden on Instagram: “Musée en plein air / zoo 🏞️
              Essayez de trouver le loup dans la dernière photo 🧐🐺”" />

          I NEED TO GET THE VIDEO TOO
    */