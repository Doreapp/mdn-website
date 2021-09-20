(() => {
    const _qs = query => {
        return document.querySelector(query)
    }

    const fillPageHeader = profile => {
        if ("username" in profile) {
            _qs("#instagram-username").innerText = "@"+profile.username
        } else {
            console.warn("username attribute not found in profile.")
        }

        if("biography" in profile) {
            _qs("#instagram-biography").innerText = profile.biography
        } else {
            console.warn("biography attribute not found in profile.")
        }

        let statsContainer = _qs("#instagram-stats")
        const addStats = text => {
            let val = document.createElement("div")
            val.classList.add("instagram-stat")
            val.innerText = text
            statsContainer.appendChild(val)
        }

        if("followers" in profile) {
            addStats(profile.followers+" followers")
        } else {
            console.warn("followers attribute not found in profile.")
        }
        
        if("posts" in profile) {
            addStats(profile.posts.length+" posts")
        } else {
            console.warn("posts attribute not found in profile.")
        }
    }

    const buildMedia = media => {
        if ("videoUrl" in media) {
            let element = document.createElement("video")
            element.src = "/sweden/api?command=getInstagramVideo&id="+media.id
            element.classList.add("instagram-video")
            element.controls="true"
            return element
        } else {
            let element = document.createElement("img")
            element.src = "/sweden/api?command=getInstagramImage&id="+media.id
            element.classList.add("instagram-image")
            //element.width = media.dimensions.width
            //element.height = media.dimensions.height
            return element
        }
    }

    const dayStr = date => {
        let days = ["Dimanche", "Lundi","Mardi","Mercredi","Jeudi", "Vendredi", "Samedi"]
        let months = ["Janvier", "Février", "Mars", "Avril", "Mai","Juin", "Juillet", "Août", "Septembre","Octobre","Novemebre","Décembre"]
        return days[date.getDay()]+" "+date.getDate()+" "+months[date.getMonth()]+" "+date.getFullYear()
    }

    const buildPost = post => {
        let container = document.createElement("div")
        container.classList.add("instagram-post")

        // Date
        let date = new Date(post.time*1000)
        let dayDiv = document.createElement("div")
        dayDiv.innerText = dayStr(date)
        dayDiv.classList.add("date")
        container.appendChild(dayDiv)

        let descriptionDiv = document.createElement("div")
        descriptionDiv.innerText = post.caption
        descriptionDiv.classList.add("description")
        container.appendChild(descriptionDiv)

        // Posts
        post.medias.forEach(media => {
            container.appendChild(buildMedia(media))
        }) 
        return container
    }

    const fillBuildPosts = posts => {
        let container = _qs("#instagram-posts")
        posts.forEach(post => {
            container.appendChild(buildPost(post))
        })
    }

    const fillPageWithProfile = profile => {
        console.log("Fill page with profile")

        fillPageHeader(profile)
        
        fillBuildPosts(profile.posts)
    }

    Mdn.apiCall("sweden", "getInstagramProfile")
        .then(profile => {
            console.log("Profile: ", profile)
            fillPageWithProfile(profile)
        })

    Mdn.init();
})()