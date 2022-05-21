const socket   = require('./socket');
const database = require('./database');
const api      = require('./api');
const utils    = require('./utils');

new database();
socket();
api();

// const userModel = require('./userModel')
//  
// userModel.create({ 
//     id: utils.generateID(),
//     token: utils.generateToken(),
//     username: "Kwerku",
//     email: "kewrkuszef@gmail.com",
//     password: "aniado6424814",
// })
