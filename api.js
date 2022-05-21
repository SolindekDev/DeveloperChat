module.exports = () => {
    const url = "http://localhost/"

    const express = require('express')
    const app = express()

    const utils = require('./utils')
    const userModel = require('./userModel')
    
    const bodyParser = require('body-parser')
    const cookieParser = require('cookie-parser')
    const validator = require("email-validator");
    const passwordValidator = require('password-validator');
    const fetch = require('node-fetch')
    
    app.use(cookieParser())
    app.set('view engine', 'ejs')
    app.use('/public', express.static('public'))
    
    const passwordSchema = new passwordValidator();
    const jsonParser = bodyParser.json()
    const urlencodedParser = bodyParser.urlencoded({ extended: false })
    
    app.get("/", (req, res) => {
        if (req.cookies.token == undefined || req.cookies.token == '') return res.render("index", { account: null })
        
        userModel.findOne({ token: req.cookies.token }, (err, user) => {
            if (user == null) return res.render("index", { account: null })

            return res.render("index", { account: user })
        })
    })
    
    app.get("/login", (req, res) => {
        res.render("login", { message: null })
    })

    app.post("/login", urlencodedParser, async (req, res) => {
        const { email, password } = req.body;

        if (!email) return res.render("login", { message: "Please enter your email" })
        if (!password) return res.render("login", { message: "Please enter your password" })
        
        const response = await fetch(url + "api/1v/login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        const body = await response.json()

        if (response.status == 400)
            res.render("login", { message: body.message })
        else {
            res.cookie("token", body.user.token)
            res.redirect(url + "client")
        }
    })
    
    app.get("/logout", (req, res) => {
        if (req.cookies.token == undefined || req.cookies.token == '') return res.render("404")
        
        userModel.findOne({ token: req.cookies.token }, (err, user) => {
            if (user == null) return res.render("404")

            res.cookie("token", "")
            res.redirect(url + "login")
        })
    })

    app.get('/soon', (req, res) => {
        res.render("soon")
    })

    app.get("/register", (req, res) => {
        res.render("register", { message: null })
    })

    app.post("/register", urlencodedParser, async (req, res) => {
        const { email, username, password } = req.body;

        if (!email) return res.render("login", { message: "Please enter your email" })
        if (!username) return res.render("login", { message: "Please enter your username" })
        if (!password) return res.render("login", { message: "Please enter your password" })
        
        const response = await fetch(url + "api/1v/register", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                username: username,
                password: password
            })
        })
        const body = await response.json()

        if (response.status == 400)
            res.render("register", { message: body.message })
        else {
            res.cookie("token", body.user.token)
            res.redirect(url + `thanksForRegister?username=${body.user.username}&email=${body.user.email}`)
        }
    })
    
    app.get("/thanksForRegister", (req, res) => {
        if (!req.query.username || !req.query.email) return res.render("404")

        res.render("thanksForRegister", { username: req.query.username, email: req.query.email })
    })

    app.get("/client", (req, res) => {
        if (req.cookies.token == null || req.cookies.token == undefined || req.cookies.token == '') return res.render("404")
        res.render("client")
    })    

    app.post("/api/1v/register", jsonParser, (req, res) => {
        const { email, username, password } = req.body
    
        if (!email) return res.status(400).json({message: "Email is not given!" })
        if (!username) return res.status(400).json({message: "Username is not given!" })
        if (!password) return res.status(400).json({message: "Password is not given!" })
    
        if (email.length < 6) return res.status(400).json({message: "Email is to short" })
        if (email.length > 50) return res.status(400).json({message: "Email is to long" })
        if (!validator.validate(email)) return res.status(400).json({message: "Email is not correct" })
        
        if (username.length < 3) return res.status(400).json({message: "Username is to short" })
        if (username.length > 24) return res.status(400).json({message: "Username is to long" })
    
        if (!passwordSchema.validate(password)) return res.status(400).json({message: "The password must have a minimum of 8 characters, a minimum of one capital letter and a minimum of two numbers" })
    
        userModel.findOne({ email: email }, (err, users) => {
            if (err) return res.status(400).json({message: "Something goes wrong" })
            if (users == null) { 
                userModel.findOne({ username: username }, (err, userr) => {
                    if (err) return res.status(400).json({message: "Unknown database error" })
                    if (userr == null) {
                        userModel.create({ 
                            username: username, 
                            email: email, 
                            password: utils.encrypt(password),
                            token: utils.generateToken(),
                            id: utils.generateID(),
                        }, (err, userrr) => {
                            return res.status(200).json({ message: "Successfully registered", user: {
                                id: userrr.id,
                                email: userrr.email,
                                username: userrr.username,
                                password: utils.decrypt(userrr.password),
                                token: userrr.token,
                                developerCoins: userrr.developerCoins,
                            }})
                        })
                    } else {
                        return res.status(400).json({message: "Username is already taken" })
                    }
                })
            } else {
                return res.status(400).json({message: "Email is already taken" })
            }
        })
    })

    app.post("/api/1v/login", jsonParser, (req, res) => {
        const { email, password } = req.body
    
        if (!email) return res.status(400).json({ message: "Email is not given!" })
        if (!password) return res.status(400).json({ message: "Password is not given!" })
    
        // userModel.findOne({ email: email, password: utils.encrypt(password) }, (err, user) => {
        //     if (err) return res.status(400).json({ message: "Something goes wrong" })
        //     console.log(user, utils.encrypt(password), email, password)
        //     if (user == null) return res.status(400).json({ message: "Email or password is incorrect" })
    
        //     return res.status(200).json({ message: "Successfully logged", user: {
        //         id: user.id,
        //         email: user.email,
        //         username: user.username,
        //         password: utils.decrypt(user.password),
        //         token: user.token,
        //         developerCoins: user.developerCoins,
        //     }})
        // })
        userModel.find({ }, (err, users) => {
            const ourUser = users.find(u => utils.decrypt(u.password) == password)

            if (err) return res.status(400).json({ message: "Something goes wrong" })
            if (ourUser == undefined) return res.status(400).json({ message: "Email or password is incorrect" })

            return res.status(200).json({ message: "Successfully logged", user: {
                id: ourUser.id,
                email: ourUser.email,
                username: ourUser.username,
                password: utils.decrypt(ourUser.password),
                token: ourUser.token,
                developerCoins: ourUser.developerCoins,
            }})
        })
    })
    
    app.listen(80, () => {
        console.log("listening on port 80; http://localhost/");
    })
}
