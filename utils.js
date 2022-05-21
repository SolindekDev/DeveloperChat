const crypto = require('crypto-js')

function generateID() {
    const constants = "0123456789987422183950239018910481"
    let   timestamp = new Date().getTime().toString()
    let   result    = ""

    for (let i = 0; i < 4; i++) 
        result += timestamp[i]
    for (let i = 0; i < 5; i++) 
        result += constants[Math.floor(Math.random() * constants.length)]
    for (let i = 0; i < 4 ; i++) 
        result += timestamp[(timestamp.length-1) - i]

    return result
}

function generateToken() {
    const constants = "abcdfjakdhsjadbldjskadasjnjxcdsjkMJNDSKJADKSANXJSANXLKJSABNHDNUQDHNJAWSHDNXUWANDJLASBNj3wnq2u1230-e2dsaklajd['][']'./.adaw[daw[d[adlaw[024931894djnaunw3sdm,xlada-=-=1jmioma./z.xmlk"
    let   timestamp = new Date().getTime().toString()
    let   result    = ""

    for (let i = 0; i < 2; i++) 
        result += constants[Math.floor(Math.random() * constants.length)]
    for (let i = 0; i < 3; i++) 
        result += timestamp[i]
    for (let i = 0; i < 18; i++) 
        result += constants[Math.floor(Math.random() * constants.length)]
    for (let i = 0; i < 5; i++) 
        result += timestamp[(timestamp.length-1) - i]
    for (let i = 0; i < 16; i++) 
        result += constants[Math.floor(Math.random() * constants.length)]

    return result
}

function encrypt(text) {
    return crypto.AES.encrypt(text, 'Ml1nuj03M!934MKDnALlasaowqpcm').toString()
}

function decrypt(hash) {
    return crypto.AES.decrypt(hash, 'Ml1nuj03M!934MKDnALlasaowqpcm').toString(crypto.enc.Utf8)
}

module.exports = { 
    encrypt,
    decrypt,
    generateID,
    generateToken
}