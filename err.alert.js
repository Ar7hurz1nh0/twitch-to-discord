const colors = require('colors')

function alertInfo(message) {
    var sec, min, hour
    sec = new Date().getSeconds()
    min = new Date().getMinutes()
    hour = new Date().getHours()
    function fNsec (s) {
        if (s<10) return "0" + sec
        else return sec
    }
    function fNmin (m) {
        if (m<10) return "0" + min
        else return min
    }
    console.log(colors.bgRed(colors.black(`[Error]`)) + colors.red(` (${hour}:${fNmin(min)}:${fNsec(sec)}) ${message}`))
}

module.exports = alertInfo