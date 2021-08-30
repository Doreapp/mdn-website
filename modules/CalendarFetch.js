const https = require('https')

// Calendar URL

const fetchCalendar = (url = 
  "https://www.kth.se/social/user/282379/icalendar/b5167b5d6e589f7c7bc356529c66bcdf6721b93c") => {

    return new Promise((resolve, reject) => {

      const req = https.request(url,
        {
          port: 443,
          method: 'GET'
        }, res => {
          console.log(`statusCode: ${res.statusCode}`)
        
          let result = ""
  
          res.on('data', data => {
            result += data.toString()
          })
  
          res.on('end', () => {
            resolve(result)
          })
        })
        
      req.on('error', error => {
          reject(error)
      })
      
      req.end()
    })
}

module.exports = {
    fetchCalendar: fetchCalendar
}
