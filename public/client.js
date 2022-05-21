const selectionChannel = document.getElementById("channel")
// const updateChannelButton = document.getElementById("update_channel")
var sendMessageButton = document.getElementById("send_message")
var messageContentValue = document.getElementById("message_content")
const notifications = document.querySelector(".notifications")
const saDiv = document.querySelector(".sa")
const selectDiv = document.querySelector(".select")
const messageDiv = document.querySelector(".messages")

const socket = new WebSocket("ws://localhost:3018/")
let authorization = { }
let actualChannel = "none"

var notificationsAmount = 0

function getCookie(name) {
    name = name + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
  
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
  
        if (cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
}

class Notification { 
    constructor(title, description) {
        if (!title)   throw new Error("title is required")
        if (!description) throw new Error("description is required")

        this._title = title;
        this._description = description;
        this._notifications = notifications;
    }

    show() {
        if (notificationsAmount > 4)
            return
        notificationsAmount++
        this._notification = document.createElement("div")
        this._notification.innerHTML = `<div class="notification-title">${this._title}</div>
        <div class="notification-description">${this._description}</div>`
        this._notification.classList.add("notification")
        this._notifications.appendChild(this._notification)
        setTimeout(() => {
            this._notification.style.display = "none"
            notificationsAmount--
        }, 6000)
    }
}

socket.onerror = (e) => {
    const body = document.querySelector(".body")
    body.style.backgroundColor = "tomato"
    const section = body.querySelector("section")
    section.style.display = "flex"
    const a = body.querySelector(".flex-container")
    a.style.display = "none"
}

function messageSend(message) {
    socket.send(JSON.stringify({ action: 1, messageContent: message }))
}

function showOwnMessage(message) {
    // messageDiv.innerHTML += `<div class="message-item"><span class="message-title">${message.authorization.name}</span><br>${message.messageContent}</div>`
    const messageItem = document.createElement('div');
    messageItem.classList.add('message-item')
    messageItem.innerHTML = `<div class="message-up"><span class="message-title">${authorization.username}</span><span class="message-date"> ${new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")}</span></div>${message.messageContent}`;

    messageDiv.appendChild(messageItem);
    // setTimeout(() => {

    // })
    messageDiv.scrollTo({ behavior: 'smooth', top: messageDiv.scrollHeight })
}

function showMessage(message) {
    const messageItem = document.createElement('div');
    messageItem.classList.add('message-item')
    messageItem.innerHTML = `<div class="message-up"><span class="message-title">${message.user.username}</span><span class="message-date"> ${new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")}</span></div>${message.messageContent}`;

    messageDiv.appendChild(messageItem);
    window.scrollTo(0, document.body.scrollHeight);
}

function sendMessageButtonClick() {
    messageSend(messageContentValue.value)
    messageContentValue.value = ""
}

function changeChannel(channel) {
    messageDiv.innerHTML = ""
    socket.send(JSON.stringify({ action: 3, channel: channel }))
    actualChannel = channel
    inputDivStaff()
}

function setUserAuth() {
    const userAuthText = document.getElementById("user-auth")
    userAuthText.innerText = "You are: " + authorization.username
}

socket.onopen = (e) => {
    console.log("[WebSocket] Connection established")
}

socket.onmessage = (data) => {
    const parse = JSON.parse(data.data)
    if (parse.code == -2) {
        // authorization = parse.authorization
        // setUserAuth()
        // console.log(`[WebSocket] ${data.data}`)
    } else if (parse.code == -3) {
        console.log("[WebSocket] Heartbeat from server")
    } else if (parse.code == -6) { 
        showOwnMessage(parse)
    } else if (parse.code == -5) { 
        showMessage(parse)
    } else if (parse.code == -7) {
        new Notification("Cooldown bro...","You are sending messages too fasttt! Wait 2 seconds before sending another message.").show()
    } else if (parse.code == -8) {
        new Notification("You're message is too long...","Are you a poet, a writer? Why are you writing so much, our chat allows you to send only 500 characters in one message").show()
    } else if (parse.code == 3) {
        authorization = parse.authorization
        setUserAuth()
    } else if (parse.code == -100) {
        if (getCookie("token") == undefined) {
            new Notification("Authorization goes wrong", "Please login in again, you're token is not given in cookies").show()
        } else {
            socket.send(JSON.stringify({ action: 4, token: getCookie("token") }))
        }
    } else if (parse.code == -12) {
        new Notification("Something goes wrong","Unknown database error.").show()
    } else if (parse.code == -13 || parse.code == -16) {
        new Notification("Authorization failed","Something goes wrong with you're account, please login in again.").show()
    } else {
        console.log(`[WebSocket] ${data.data}`)
    }
}

function inputDivStaff() {
    if (actualChannel == "none") {
        messageDiv.innerHTML =`<section>
        <div>
            <span class="unk-error">Select the channel</span><br>
            <span>To talk with someone just select the channel that's you interested in.</span><br>
        </div>
    </section>`
        saDiv.innerHTML = ``
    } else {
        if (saDiv.innerHTML != `<div class="input">
<input type="text" name="messageContent" id="message_content">
<input type="button" id="send_message" value="Send">
</div>`) {
            messageDiv.innerHTML = ''
            saDiv.innerHTML = `<div class="input">
<input type="text" name="messageContent" id="message_content">
<input type="button" id="send_message" value="Send">
</div>`
            messageContentValue = document.getElementById("message_content")
            sendMessageButton = document.getElementById("send_message")
            sendMessageButton.addEventListener("click", sendMessageButtonClick)
        }
    }
}

inputDivStaff()
setInterval(() => { inputDivStaff(); }, 1000)

selectionChannel.onchange = () => {
    // Update channel
    changeChannel(selectionChannel.value)
} 

window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented)
        return

    if (event.key == "Enter") {
        if (messageContentValue == document.activeElement) {
            sendMessageButtonClick()
        }
    }  
})