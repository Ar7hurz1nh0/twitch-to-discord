const colors = require('colors')

const err = require('./alerts/err.alert.js')
const info = require('./alerts/info.alert.js')

async function loader(twitch/*, youtube*/) {
    if (twitch) {
        await require('./twitch/twitch.js')
        info(colors.green("Twitch module loaded"))
    }
    else info(colors.red("Skipped Twitch module"))
    /*
    if (youtube) {
        await require('./youtube/youtube.js')
        info(colors.green("Youtube module loaded"))
    }
    else info(colors.red("Skipped Youtube module"))*/
}

async function main() {
    await loader(true/*, false*/)
    info(colors.green("All modules loaded"))
}

main()