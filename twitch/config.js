const config = {
    channels: ["Ronablee", "Ar7hurz1nh0", "agathinha00", "hugochino59", "iMenastro", "Yahiamice"],
    config: {
        onlyEmbed: true, //It just ignores the "message" in msgs
        useConsole: true, //Use console webhook (configure in .env)
        onlyConsole: false, //Use only console (require useConsole = true, only works if verbose = false)
        consoleLiveChanges: true, //Send live changes in console (requires useConsole = true, only works if verbose = false)
        verbose: false, //Send a message for Webhook Console with every proccess (requires useConsole = true)
        dontRenotify: true, //Do not send other notfication if app restarts
        timeout: 1 //time in minutes to repeat the loop
    },
    msgs: {
        noCategory: "No category",
        message: "@here",
        liveMessage: "Streaming",
        category: "Category",
        startedAt: "Started at",
        botWatermark: "Bot | Quantum Labs",
        botOn: "🤖 Bot ativado"
    }
}

module.exports = config