const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    id: { type: String, unique: true, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    developerCoins: { type: Number, required: false, default: 0 }
}) 

const userModel = mongoose.model('users', userSchema);

module.exports = userModel