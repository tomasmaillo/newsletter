var express = require('express');
var app = express();
var crypto = require('crypto');
const bodyParser = require("body-parser");
require('dotenv').config();

//app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({
    extended: true
}));

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log(process.env.DOMAINNAME || ('http://localhost:' + port));
});


// FIREBASE DB
var admin = require("firebase-admin");
var serviceAccount = (JSON.parse(process.env.SERVICEACCOUNTKEY));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASEURL
});

var db = admin.database();
var ref = db.ref("users");


// NODEMAILER
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});


// Confirmation Process
// TODO: Change order of sending email and storing in db, in case email is sent but error when storing in db. 
app.post("/newemail", (req, res) => {
    // Send email
    let confirmationString = crypto.randomBytes(16).toString('hex');
    if (sendConfirmationEmail(req.body.email, confirmationString)) {

        // Add record to DB
        let newEmailOpts = {};
        newEmailOpts[confirmationString] = { email: req.body.email, status: "unconfirmed" };


        ref.update(newEmailOpts, (error) => {
            if (error) {
                console.log('Error when saving new record: ' + error)
            } else {
                res.send({ status: 200 });
            }
        });

    } else {
        console.log("errro")
        res.send({ status: 500 });
    }

});

async function sendConfirmationEmail(email, confirmationString) {

    let mailOptions = {
        from: '"Tomas 👻" <tomasmaillonewsletter@gmail.com>',
        to: email,
        subject: "Hello ✔",
        text: "Hello world?" + confirmationString,
        html: "<h2>Hi :D</h2> <br> " + (process.env.DOMAINNAME || ('http://localhost:' + port)) + "/confirm/" + confirmationString,
    }

    return await transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log("Error in sending mail");
            return false;
        }
        console.log("Message sent: %s", info.messageId);
        return true;
    });

}

// Serving favicon
app.get('/favicon.ico', function(req, res) {
    res.sendFile(__dirname + "/public/favicon.png");
});

// Serving main tomasmaillo
app.get('/', function(req, res) {
    res.sendFile(__dirname + "/public/main/" + "index.html");
});

// Serving CSS and JS
app.get('/styles/:fileName', function(req, res) {
    res.sendFile(__dirname + "/public/css/" + req.params.fileName + ".css");
});

app.get('/js/:fileName', function(req, res) {
    res.sendFile(__dirname + "/public/js/" + req.params.fileName + ".js");
});

// Serving newsletter signup
app.get('/newsletter', function(req, res) {
    res.sendFile(__dirname + "/public/newsletter/" + "index.html");
});

/*
app.get('/confirm/styles.css', function(req, res) {
    res.sendFile(__dirname + "/public/main/" + "styles.css");
});
*/

app.get("/confirm/:confirmationString", async(req, res) => {
    await ref.once("value", function(data) {
        let confirmationString = req.params.confirmationString;
        console.log()

        if (confirmationString in JSON.parse(JSON.stringify(data))) {
            let email = JSON.parse(JSON.stringify(data))[confirmationString]["email"];

            let newEmailOpts = {};
            newEmailOpts[confirmationString] = {
                email: email,
                status: "confirmed",
                dateJoined: currentTimeInMilliseconds = Date.now()
            };
            console.log(newEmailOpts)

            ref.update(newEmailOpts, (error) => {
                if (error) {
                    console.log('Error when saving new record: ' + error)
                } else {
                    //res.send("kldjñ")
                    res.sendFile(__dirname + "/public/newsletter/confirmed.html");
                }
            });
        } else {
            res.sendFile(__dirname + "/public/newsletter/error.html")
        }
    });

});