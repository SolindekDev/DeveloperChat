const userModel = require('./userModel');

module.exports = () => {
    const { WebSocketServer } = require('ws');
    const utils = require('./utils');

    const wss = new WebSocketServer({ port: 3018 })
    
    const NONE_CHANNEL = "none"
    const RUBY_CHANNEL = "ruby"
    const JAVASCRIPT_CHANNEL = "javascript"
    const JAVA_CHANNEL = "java"
    const GO_CHANNEL = "go"
    const GENERAL_CHANNEL = "general"
    
    const COOLDOWN_MESSAGE = 2000
    
    const CHANNELS = [
        "none",
        "ruby", 
        "javascript",
        "java",
        "go",
        "general",
    ]
    
    function sendMessageAllOverClients(actualClient, messageContent) {
        wss.clients.forEach(client => {
            if (client.channel == actualClient.channel) {
                if (client.authorization != actualClient.authorization) {
                    client.send(JSON.stringify({ message: "Message send", code: -5, messageContent: messageContent, user: actualClient.authorization }))
                }
            }
        })
    }
    
    wss.on('connection', (cl) => {
        const heartbeat = setInterval(() => {
            cl.send(JSON.stringify({ message: "Heartbeat", code: -3, channel: cl.channel }))
        }, 2000)
    
        cl.on('message', (message) => {
            try {
                const parse = JSON.parse(message)
                console.log(parse)
                if (parse.action == 1) {
                    if (cl.authExists == false) 
                        return cl.send(JSON.stringify({ message: "you are not logged", code: -16}))  

                    // Send message to server
                    if (parse.messageContent == undefined || parse.messageContent == null || parse.messageContent.trim().length == 0)
                        return cl.send(JSON.stringify({ message: "messageContent is not given", code: 2}))  
    
                    // Is there a cooldown?
                    if (cl.message_cooldown !== null && COOLDOWN_MESSAGE - (Date.now() - cl.message_cooldown) > 0) 
                        return cl.send(JSON.stringify({ message: "There's cooldown", code: -7, cooldown: cl.message_cooldown }))
    
                    if (parse.messageContent.length > 500)
                        return cl.send(JSON.stringify({ message: "Message is too long", code: -8 }))
    
                    sendMessageAllOverClients(cl, parse.messageContent)
                    cl.send(JSON.stringify({ message: "Message has been successfully sent", code: -6, messageContent: parse.messageContent, authorization: cl.authorization }))
                    cl.message_cooldown = Date.now()
                } else if (parse.action == 3) {
                    if (cl.authExists == false) 
                        return cl.send(JSON.stringify({ message: "you are not logged", code: -16}))  
                    // Change channel
                    if (parse.channel == undefined || parse.channel == null || parse.channel.trim().length == 0)
                        return cl.send(JSON.stringify({ message: "channel is not given", code: -9}))
                    else {
                        if (CHANNELS.includes(parse.channel)) {
                            cl.channel = parse.channel
                        } else
                            return cl.send(JSON.stringify({ message: "channel not found", code: -10}))
                    }
                } else if (parse.action == 4) {
                    // if (cl.authExists == false) 
                        // return cl.send(JSON.stringify({ message: "you are not logged", code: -16}))  

                    if (parse.token == undefined || parse.token == null || parse.token.trim().length == 0) 
                        return cl.send(JSON.stringify({ message: "token is not given", code: -11}))

                    userModel.findOne({ token: parse.token }, (err, user) => {
                        if (err) return cl.send(JSON.stringify({ message: "unknown database error", code: -12}))
                        if (user == null) return cl.send(JSON.stringify({ message: "token is not correct. authorization failed", code: -13}))
                        
                        if (cl.authCan == true || cl.authExists == false) {
                            clearTimeout(cl.timeout)
                            cl.authExists = true
                            cl.authorization = user
                            cl.send(JSON.stringify({ message: "Successfully authenticated", authorization: {
                                id: user.id,
                                email: user.email,
                                username: user.username,
                                password: utils.decrypt(user.password),
                                token: user.token,
                                developerCoins: user.developerCoins,
                            }, code: 3}))
                        } else
                            return cl.send(JSON.stringify({ message: "too late to auth or you are already authenticated", code: -14}))
                    })
                }
            } catch (e) {
                cl.send(JSON.stringify({ message: "Expected value in JSON", code: 1 }))
            }
        })
    
        cl.on("close", () => {
            clearInterval(heartbeat)
        })
    
        const rn = utils.generateID()
        cl.send(JSON.stringify({ message: "Please give token of you're account", code: -100}))
        cl.authorization = {none:true}
        cl.channel = NONE_CHANNEL
        cl.authExists = false
        cl.authCan = true

        cl.timeout = setTimeout(() => {
            cl.authCan = false
            return cl.send(JSON.stringify({ message: "too late to auth max 5 seconds after connection to websocket", code: -15}))
        }, 5000) // 5 seconds
    })
}
