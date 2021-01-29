require('dotenv/config')
const fetch = require('node-fetch')
const colors = require('colors')
const config = require('./config.js');

const err = require('../alerts/err.alert.js')
const warn = require('../alerts/warn.alert.js')
const info = require('../alerts/info.alert.js')

var u = []

var k = 0
do {
    u.push({user: config.channels[k], isLive: config.config.dontRenotify, category: 0})
    k++
}
while (typeof config.channels[k] !== 'undefined')

async function main() {
    var token, uID = 0
    try {
        token = await new Promise((res, rej) => {
            fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {method: 'POST'})
            .then(t => t.json())
            .then(t => {res(t.access_token)})
        })
    }
    catch (e) {err(e)}
    finally {
        do {
            let live = await getChannel(u[uID].user, token)
            if (live.is_live && u[uID].isLive === false) {
                if (live.game_id !== 0) var categoryName = await getCategory(live.game_id, token)
                else var categoryName = {name: config.msgs.noCategory}
                u[uID].isLive = true
                u[uID].category = live.game_id
                verbose(`${u[uID].user} is now online, streaming ${categoryName.name}`)
                onlyConsole(`${u[uID].user} is now online, streaming ${categoryName.name}`)
                info(colors.green(`${u[uID].user} is now online, streaming ${categoryName.name}`))
                await send(u[uID].user, live, categoryName)
            }
            else if (live.is_live && u[uID].isLive) {
                if (live.game_id !== 0) var categoryName = await getCategory(live.game_id, token)
                else var categoryName = {name: config.msgs.noCategory}
                if (live.game_id !== u[uID].category) {
                    u[uID].category = live.game_id
                    onlyConsole(`${u[uID].user} is still online, streaming ${categoryName.name}`)
                }
                verbose(`${u[uID].user} is still online, streaming ${categoryName.name}`)
                info(colors.yellow(`${u[uID].user} is still online, streaming ${categoryName.name}`))
            }
            else if (live.is_live === false && u[uID].isLive) {
                u[uID].isLive = false
                verbose(`${u[uID].user} is now offline`)
                onlyConsole(`${u[uID].user} is now offline`)
                info(colors.red(`${u[uID].user} is now offline`))
            }
            else {
                verbose(`${u[uID].user} is still offline`)
                info(colors.red(`${u[uID].user} is still offline`))
            }
            uID++
        }
        while (typeof u[uID] !== 'undefined')
    }
    await revoke(token)
    setTimeout(main, config.config.timeout*60000)
}

async function getChannel(channel, token) {
    return await new Promise(async (res, rej) => {
        try {
            fetch(`https://api.twitch.tv/helix/search/channels?first=1&query=${channel}`,
            {
                method: 'GET',
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(l => l.json())
            .then(l => res(l.data[0]))
        }
        catch (e) {
            err(e)
            rej(e)
        }
    })
}

async function getCategory(gameID, token) {
    return await new Promise(async (res, rej) => {
        try {
            fetch(`https://api.twitch.tv/helix/games?id=${gameID}`,
            {
                method: 'GET',
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(c => c.json())
            .then(c => res(c.data[0]))
        }
        catch (e) {
            err(e)
            rej(e)
        }
    })
}

async function revoke(token) {
    try {
        fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${process.env.CLIENT_ID}&token=${token}`, {method: 'POST'})
    }
    catch (e) {
        err(e)
        setTimeout(revoke, 1000)
    }
}

async function send(channel, live, category) {
    function min(m) {
        if (m<10) return "0" + m
        else return m
    }
    if (config.config.onlyEmbed && !config.config.onlyConsole)
        var embed = {
            "embeds": [{
                "title": `${channel} on Twitch`,
                "url": `https://twitch.tv/${channel}`,
                "color": 6570404,
                "footer": {
                    "text": config.msgs.botWatermark
                },
                    "thumbnail": {
                    "url": live.thumbnail_url
                },
                "author": {
                "name": channel,
                "icon_url": live.thumbnail_url
                },
                "fields": [
                {
                    "name": config.msgs.liveMessage,
                    "value": live.title
                },
                {
                    "name": config.msgs.category,
                    "value": category.name,
                    "inline": true
                },
                {
                    "name": config.msgs.startedAt,
                    "value": `${new Date(live.started_at).getHours()}:${min(new Date(live.started_at).getMinutes())}`,
                    "inline": true
                }
                ]
            }]
        }
    else 
        var embed = {
            "content": config.msgs.message,
            "embeds": [{
                "title": `${channel} on Twitch`,
                "url": `https://twitch.tv/${channel}`,
                "color": 6570404,
                "footer": {
                    "text": config.msgs.botWatermark
                },
                    "thumbnail": {
                    "url": live.thumbnail_url
                },
                "author": {
                "name": channel,
                "icon_url": live.thumbnail_url
                },
                "fields": [
                {
                    "name": config.msgs.liveMessage,
                    "value": live.title
                },
                {
                    "name": config.msgs.category,
                    "value": category.name,
                    "inline": true
                },
                {
                    "name": config.msgs.startedAt,
                    "value": `${new Date(live.started_at).getHours()}:${min(new Date(live.started_at).getMinutes())}`,
                    "inline": true
                }
                ]
            }]
        }
    try {
        fetch(process.env.BOT, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(embed)})
    }
    catch (e) {
        err(e)
        if (config.config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
    }
}

async function verbose(message) {
    try {
        if (config.config.useConsole && config.config.verbose) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `📜: ${message}`})})
    }
    catch (e) {
        err(e)
        if (config.config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
    }
}

async function onlyConsole(message) {
    if ((!config.config.verbose && config.config.useConsole && config.config.onlyConsole) || (!config.config.verbose && config.config.useConsole && config.config.consoleLiveChanges))
    try {
        await fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `💬: ${message}`})})
    }
    catch (e) {
        err(e)
        if (config.config.useConsole) fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": e})})
    }
}

async function init() {
    try {
        if (config.config.useConsole) await fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": config.msgs.botOn})})
        if (config.config.useConsole && config.config.verbose) await fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `📜 Verbose on`})})
        if (config.config.useConsole && config.config.onlyConsole && !config.config.verbose) await fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `💬 Only console`})})
        if (!config.config.verbose && config.config.useConsole && config.config.consoleLiveChanges && !config.config.onlyConsole) await fetch(process.env.CONSOLE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"content": `💬 Logging live changes`})})
    }
    catch (e) {err(e)}
    finally {setTimeout(main, 2500)}
}

setTimeout(init, 2500)