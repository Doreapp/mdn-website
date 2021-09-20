Mdn.init()

Mdn.apiCall("sweden","getDurationStatistics")
    .then(result => {
        console.log(result)
        Mdn.progressBars[0].setProgress(result.done, result.total)
    })