const https = require('https'),
    fs = require('fs'),
    path = require("path"),
    Logger = require("./Logger.js")


// Files
const cacheFolder = path.join(__dirname, ".cache"), // Main cache folder
    imagesFolder = path.join(cacheFolder, "images"), // images folder
    rawHtmlProfile = path.join(cacheFolder, "instagram_profile.html")

// Calendar URL
const URL = "https://www.instagram.com/tonio_in_sweden/"

class Utils {}

/**
 * Parse a string containing unicode character 
 * @param {string} url 
 * @returns parsed string
 */
Utils.parseFromUnicode = url => {
    return JSON.parse('"' + url + '"')
}

/**
 * Class representing a single media
 */
class Media {
    /*
    url {string} Url of the media (image)
    dimensions {object} dimensions (width/height) of the image
    id {integer} instagram identifier for this media
    */

    constructor(options = {}) {
        let missing = []
        let found = []

        if ("id" in options) {
            this.id = options["id"]
            found.push("id")
        } else {
            missing.push("id")
        }

        if ("dimensions" in options &&
            "width" in options.dimensions &&
            "height" in options.dimensions) {
            this.dimensions = {
                width: options.dimensions.width,
                height: options.dimensions.height,
            }
            found.push("dimensions")
        } else {
            missing.push("dimensions")
        }

        if ("display_url" in options) {
            this.url = Utils.parseFromUnicode(options["display_url"])
            found.push("url")
        } else {
            missing.push("url")
        }

        Logger.log("InstagramScrapper.Media", "<init> Media. Found " + found.length + " attributes: " + JSON.stringify(found) + ". Missing " + missing.length + " attributes: " + JSON.stringify(missing) + ".")
    }

    /**
     * Fetch the media and save in into the specified folder
     * @param {string} folder path-like string, specifying the folder to use. By default the image cache folder 
     * @returns {Promise} Once resolved, contains the path of the saved image    
     */
    fetchAndSave(folder = imagesFolder) {
        return new Promise((resolve, reject) => {
            executeGet(this.url)
                .then(data => {
                    let file = path.join(folder, this.id + ".jpg")
                    fs.writeFile(file, data, function(err) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(file)
                        }
                    })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

/**
 * Parse a media object. May retrun a Video or an Image.
 * @param {object} options media attributes to parse  
 * @returns {Media} media object, either {Image} or {Video}. undefined if parsing error.
 */
Media.parse = options => {
    if ("is_video" in options) {
        if (options.is_video) {
            return new Video(options)
        } else {
            return new Image(options)
        }
    } else {
        Logger.log("InstagramScrapper.Media", "is_video attribute not found in media options")
        console.warn("is_video attribute not found in media options")
        return undefined
    }
}

/**
 * Class representing a single image
 */
class Image extends Media {
    constructor(options = {}) {
        super(options)
    }
}

/**
 * Class representing a single video
 */
class Video extends Media {
    /*
    videoUrl {string} Url for the video element 
    */

    constructor(options = {}) {
        super(options)
        let missing = []
        let found = []

        if ("video_url" in options) {
            this.videoUrl = Utils.parseFromUnicode(options["video_url"])
            found.push("video_url")
        } else {
            missing.push("video_url")
        }

        Logger.log("InstagramScrapper.Video", "<init> Video. Found " + found.length + " attributes: " + JSON.stringify(found) + ". Missing " + missing.length + " attributes: " + JSON.stringify(missing) + ".")
    }
}

/**
 * Class representing a single post, containing one or more medias
 */
class Post {
    /*
    id {integer} Identifier for the post
    caption {string} user-input caption
    time {long} time (ms?) at which the post was published
    location_name {string} user-input location of the medias
    likes {integer} number of likes of the post
    medias {Array<Media>} medias of the post
    */

    constructor(options) {
        this.medias = []

        let missing = []
        let found = []

        if ("id" in options) {
            this.id = options["id"]
            found.push("id")
        } else {
            missing.push("id")
        }

        if ("edge_media_to_caption" in options) {
            let captionContainer = options["edge_media_to_caption"]
            this.caption = ""
            if ("edges" in captionContainer &&
                "length" in captionContainer.edges &&
                captionContainer.edges.length > 0 &&
                "node" in captionContainer.edges[0] &&
                "text" in captionContainer.edges[0].node) {
                this.caption = captionContainer.edges[0].node.text
            }
            found.push("edge_media_to_caption")
        } else {
            missing.push("edge_media_to_caption")
        }

        if ("taken_at_timestamp" in options) {
            this.time = options["taken_at_timestamp"]
            found.push("taken_at_timestamp")
        } else {
            missing.push("taken_at_timestamp")
        }

        if ("edge_liked_by" in options && "count" in options["edge_liked_by"]) {
            this.likes = options["edge_liked_by"]["count"]
            found.push("edge_liked_by.count")
        } else {
            missing.push("edge_liked_by.count")
        }

        if ("location" in options) {
            if (options.location != null && "name" in options.location) {
                this.location_name = options.location.name
            }
            found.push("location")
        } else {
            missing.push("location")
        }

        if ("edge_sidecar_to_children" in options && "edges" in options["edge_sidecar_to_children"]) {
            let _found = false,
                _missing = false
            options.edge_sidecar_to_children.edges.forEach(item => {
                if ("node" in item) {
                    this.medias.push(Media.parse(item.node))
                    _found = true
                } else {
                    _missing = true
                }
            })
            if (_found) {
                found.push("edge_sidecar_to_children.edges.node")
            }
            if (_missing) {
                missing.push("edge_sidecar_to_children.edges.node")
            }
            found.push("edge_sidecar_to_children.edges")
        } else {
            missing.push("edge_sidecar_to_children.edges")
        }

        Logger.log("InstagramScrapper.Post", "<init> Post.\n\tFound " + found.length + " attributes: " + JSON.stringify(found) + ".\n\tMissing " + missing.length + " attributes: " + JSON.stringify(missing) + ".")
    }
}

/**
 * Class representing a single Instagram profile, containing 0 to several posts
 */
class Profile {
    /*
    username {string} username of the profile
    id {integer} instagram id of the profile
    biography {string} user-input biography    
    followers {integer} count of people following this user
    following {integer} count of people this user is following 
    posts {Array<Post>} posts published by the user
    TODO last update
    TODO profile pic ?
    */

    constructor(options) {
        this.posts = []

        let missing = []
        let found = []

        if ("biography" in options) {
            this.biography = options["biography"]
            found.push("biography")
        } else {
            missing.push("biography")
        }

        if ("username" in options) {
            this.username = options["username"]
            found.push("username")
        } else {
            missing.push("username")
        }

        if ("edge_followed_by" in options && "count" in options["edge_followed_by"]) {
            this.followers = options["edge_followed_by"]["count"]
            found.push("edge_followed_by.count")
        } else {
            missing.push("edge_followed_by.count")
        }

        if ("edge_follow" in options && "count" in options["edge_follow"]) {
            this.following = options["edge_follow"]["count"]
            found.push("edge_follow.count")
        } else {
            missing.push("edge_follow.count")
        }

        if ("edge_owner_to_timeline_media" in options && "edges" in options["edge_owner_to_timeline_media"]) {
            let array = options["edge_owner_to_timeline_media"]["edges"]
            let _found = false
            let _missing = false
            array.forEach(item => {
                if ("node" in item) {
                    this.posts.push(new Post(item["node"]))
                    _found = true
                } else {
                    _missing = true
                }
            })
            if (_found) {
                found.push("edge_owner_to_timeline_media.edges.node")
            }
            if (_missing) {
                missing.push("edge_owner_to_timeline_media.edges.node")
            }
            found.push("edge_owner_to_timeline_media.edges")
        } else {
            missing.push("edge_owner_to_timeline_media.edges")
        }

        Logger.log("InstagramScrapper.Profile", "<init> Profile.\n\tFound " + found.length + " attributes: " + JSON.stringify(found) + ".\n\tMissing " + missing.length + " attributes: " + JSON.stringify(missing) + ".")
    }
}

/**
 * Execute a HTTPS GET request. 
 * Provide the return 
 * @param {string} url URL to fetch 
 * @returns Promise, when fullfiled, provide the request response content (body)
 */
const executeGet = (url) => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
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

const saveProfileHTML = (html) => {
    Logger.log("InstagramScrapper", "Saving html profile")
    return new Promise((resolve, reject) => {
        fs.writeFile(rawHtmlProfile, html, function(err) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

const readProfileHTML = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(rawHtmlProfile, "utf-8", function(err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

/**
 * Fetch instagram profile from the online URL
 * @param {string} url Optional instagram profile url  
 * @returns promise, when fullfiled provides the html file content
 */
const fetchInstagram = (url = URL) => {
    console.log("Fetch Instagram page")
    Logger.log("InstagramScrapper", "Fetching instagram profile at url " + url)
    return executeGet(url)
}

const parseInstagramProfile = html => {
    Logger.log("InstagramScrapper", "Parsing instagram profile")

    let startStr = '<script type="text/javascript">window._sharedData = '
    let endStr = '</script>'
    let start = html.indexOf(startStr)
    let end = html.indexOf(endStr, start)

    let value = html.substring(start + startStr.length, end - 1)
        //console.log(value)

    let object = JSON.parse(value)
        //console.log(object)

    let profile = undefined
    if ("entry_data" in object &&
        "ProfilePage" in object["entry_data"] &&
        "length" in object["entry_data"]["ProfilePage"] &&
        object["entry_data"]["ProfilePage"].length > 0 &&
        "graphql" in object["entry_data"]["ProfilePage"][0] &&
        "user" in object["entry_data"]["ProfilePage"][0]["graphql"]) {
        let options = object["entry_data"]["ProfilePage"][0]["graphql"]["user"]

        profile = new Profile(options)
    } else {
        console.log("Unable to find right path into profile definition (attributes)")
    }

    return profile
}

const tryToUpdate = async() => {
    try {
        let html = await fetchInstagram()
        if (html.length > 10) {
            let profile = parseInstagramProfile(html)
            if (profile) {
                Logger.log("InstagramScrapper", "Saved updated Instagram profile html")
                saveProfileHTML(html) // Save the html in cache
            }
        }
    } catch (err) {
        Logger.log("InstagramScrapper", "Impossible to fetch remote instagram profile")
    }
}

const getInstagramProfile = () => {
    return new Promise((resolve, reject) => {
        readProfileHTML()
            .then(html => {
                tryToUpdate()

                let profile = parseInstagramProfile(html)
                if (profile) {
                    resolve(profile)
                } else {
                    reject("Impossible to parse instagram profile")
                }
            })
            .catch(err => {
                console.log("Impossible to read cached instagram profile, fetch it from remote")
                Logger.log("InstagramScrapper", "Impossible to read cached instagram profile. Fetch from remote. Error:", err)
                fetchInstagram()
                    .then(html => {
                        if (html.length > 10) {
                            let profile = parseInstagramProfile(html)
                            if (profile) {
                                saveProfileHTML(html) // Save the html in cache

                                resolve(profile)
                            } else {
                                reject("Impossible to parse instagram profile")
                            }
                        } else {
                            reject("Instagram refused access to remote instagram profile")
                        }
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
    })
}

module.exports = {
    getInstagramProfile: getInstagramProfile,
}

// Create the image folder 
//TODO useless ?
if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder)
}