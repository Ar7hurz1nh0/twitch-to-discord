require('dotenv/config')
const fetch = require('node-fetch')
const colors = require('colors')
const err = require('./err.alert.js')
const warn = require('./warn.alert.js')
const info = require('./info.alert.js')

//dont forget to setup .env

//put here the channels that you want to be notified
//if is just one, use ["channel_name"], do not remove the brackets
//the name must match the channel url
    //example: twitch.tv/channel_name
    //channels = ["channel_name"]
const channels = ["agathinha00", "Ar7hurz1nh0", "Felps", "yueko"]

//change here what messages you want to display
const msgs = {
    message: "@here",
    liveMessage: "Streaming",
    category: "Category",
    startedAt: "Started at",
    botWatermark: "AgaBot | Quantum Labs",
    botOn: "🤖 AgaBot ativado"
}

//configs

const config = {
    useConsole: true, //Use console webhook (configure in .env)
    verbose: false, //Send a message for Webhook Console with every proccess (requires useConsole = true)
    dontRenotify: true, //Do not send other notfication if app restarts
    timeout: 1 //time in minutes to repeat the loop
}

//you can ignore the code from here, unless you want to modify the code more deeply

var u = []
var uID = 0

var k = 0
do {
    u.push({user: channels[k], isLive: config.dontRenotify})
    k++
}
while (typeof channels[k] !== 'undefined')

async function getToken() {
    try {
        fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`, {method: 'POST'})
            .then(a => a.json())
            .then(a => {
                info(`Access token: Bearer ${a.access_token}`)

                async function revoke() {
                    try {
                        fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${process.env.CLIENT_ID}&token=${a.access_token}`, {method: 'POST'})
                        .then(info(`Token (${a.access_token}) revoked`))
                    }
                    catch (e) {
                        err(e)
                        setTimeout(revoke, 1000)
                    }
                    finally {setTimeout(getToken, config.timeout*60000)}
                }

                async function live() {
                    if (typeof channels[uID] === 'undefined') {
                        info("No more users")
                        uID = 0
                        revoke()
                    }
                    else {
                        try {
                            fetch(`https://api.twitch.tv/helix/search/channels?first=1&query=${channels[uID]}`,
                            {
                                method: 'GET',
                                headers: {
                                    'Client-ID': process.env.CLIENT_ID,
                                    'Authorization': `Bearer ${a.access_token}`
                                }
                            })
                            .then(b => b.json())
                            .then(async b => {
                                var j, i = ""
                                for (i in b.data) {
                                    if ((b.data[i].is_live && u[uID].isLive === false)) {
                                        u[uID].isLive = b.data[i].is_live
                                        try {
                                            info(colors.green(`${channels[uID]} is online`))
                                            if (config.verbose && config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `${channels[uID]} is online`})})
                                            fetch(`https://api.twitch.tv/helix/games?id=${b.data[i].game_id}`,
                                            {
                                                method: 'GET',
                                                headers: {
                                                    'Client-ID': process.env.CLIENT_ID,
                                                    'Authorization': `Bearer ${a.access_token}`
                                                }
                                            })
                                            .then(c => c.json())
                                            .then(c => {
                                                for (j in c.data) {
                                                    send()

                                                    async function send() {
                                                        try {
                                                            function min (m) {
                                                                if (m<10) return "0" + m
                                                                else return m
                                                            }
                                                            fetch(process.env.BOT, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
                                                                    "content": msgs.message,
                                                                    "embeds": [{
                                                                        "title": `${channels[uID]} on Twitch`,
                                                                        "url": `https://twitch.tv/${channels[uID]}`,
                                                                        "color": 6570404,
                                                                        "footer": {
                                                                            "text": msgs.botWatermark
                                                                        },
                                                                            "thumbnail": {
                                                                            "url": b.data[i].thumbnail_url
                                                                        },
                                                                        "author": {
                                                                        "name": channels[uID],
                                                                        "icon_url": b.data[i].thumbnail_url
                                                                        },
                                                                        "fields": [
                                                                        {
                                                                            "name": msgs.liveMessage,
                                                                            "value": b.data[i].title
                                                                        },
                                                                        {
                                                                            "name": msgs.category,
                                                                            "value": c.data[j].name,
                                                                            "inline": true
                                                                        },
                                                                        {
                                                                            "name": msgs.startedAt,
                                                                            "value": `${new Date(b.data[i].started_at).getHours()}:${min(new Date(b.data[i].started_at).getMinutes())}`,
                                                                            "inline": true
                                                                        }
                                                                        ]
                                                                    }]
                                                                })})
                                                                .then(uID++)
                                                                .then(live())
                                                        }
                                                        catch (e) {
                                                            err(e)
                                                            setTimeout(send, 1000)
                                                            if (config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
                                                        }
                                                    }

                                                }
                                            })
                                        }
                                        catch (e) {
                                            err(e)
                                            setTimeout(live, 1000)
                                            if (config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
                                        }
                                    }
                                    else {
                                        if (u[uID].isLive && b.data[i].is_live) {
                                            info(colors.green(`${channels[uID]} is still online`))
                                            if (config.verbose && config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `${channels[uID]} is still online`})})
                                        }
                                        else {
                                            u[uID].isLive = b.data[i].is_live
                                            if (config.verbose && config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `${channels[uID]} is offline`})})
                                            info(colors.red(`${channels[uID]} is offline`))
                                        }
                                        uID++
                                        live()
                                    }
                                }
                            })
                        }
                        catch (e) {
                            err(e)
                            setTimeout(live, 1000)
                            if (config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
                        }
                    }
                }
            live()
        })
    }
    catch (e) {
        err(e)
        setTimeout(getToken, 1000)
        if (config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
    }
}

try {
    if (config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": msgs.botOn})})
    if (config.verbose && config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": "Verbose on 📜"})})
}
catch (e) {
    err(e)
    if (config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
}

getToken()