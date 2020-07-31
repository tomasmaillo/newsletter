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

// Serving favicon
app.get('/favicon.ico', function(req, res) {
    res.sendFile(__dirname + "/public/favicon.png");
});

// Serving CSS and JS
app.get('/styles/:fileName', function(req, res) {
    res.sendFile(__dirname + "/public/css/" + req.params.fileName + ".css");
});

app.get('/js/:fileName', function(req, res) {
    res.sendFile(__dirname + "/public/js/" + req.params.fileName + ".js");
});

// Serving newsletter signup
app.get('/', function(req, res) {
    res.sendFile(__dirname + "/public/newsletter/" + "index.html");
});

app.get('/newsletter', function(req, res) {
    res.sendFile(__dirname + "/public/newsletter/" + "index.html");
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
app.post("/newemail", async(req, res) => {

    let newEmailProcessChecklist = {};

    let confirmationString = crypto.randomBytes(16).toString('hex');

    // Unique email ?
    let newEmail = req.body.email;
    await uniqueEmail(newEmail) ? newEmailProcessChecklist["uniqueEmail"] = true : newEmailProcessChecklist["uniqueEmail"] = false;

    newEmailProcessChecklist["uniqueEmail"] = true
        // Send email
    if (newEmailProcessChecklist["uniqueEmail"]) {
        await sendConfirmationEmail(newEmail, confirmationString) ? newEmailProcessChecklist["emailSent"] = true : newEmailProcessChecklist["emailSent"] = false;
    }

    // Add unconfirmed new email to DB
    if (newEmailProcessChecklist["emailSent"]) {
        let newEmailOpts = {};
        newEmailOpts[confirmationString] = { email: newEmail, status: "unconfirmed" };
        await ref.update(newEmailOpts, (error) => {
            !error ? newEmailProcessChecklist["DBUpdate"] = true : newEmailProcessChecklist["DBUpdate"] = false;
        });
    }

    console.log(newEmailProcessChecklist);
    if (newEmailProcessChecklist["DBUpdate"]) {
        res.send({ status: 200, message: "Check your email" });
    } else {
        res.send({ status: 500, message: newEmailProcessChecklist });
    }

});



// Returns true if email sent is not in DB
async function uniqueEmail(email) {
    let unique = true;
    await ref.once("value", function(data) {
        data.forEach((record) => {
            if (email === record.toJSON().email) {
                console.log(email + "    " + record.toJSON().email)
                unique = false;
            }
        });
    });
    return unique;
}

// Confirmation email
async function sendConfirmationEmail(email, confirmationString) {

    let mailOptions = {
        from: '"Tomas 👻" <tomasmaillonewsletter@gmail.com>',
        to: email,
        subject: "Hello ✔",
        text: "Hello world?" + confirmationString,
        html: `<head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
            body {
                font-family: 'Roboto', sans-serif;
                background-color: #E2F3F0;
            }
            
            h1 {
                font-size: 2.5rem;
                font-weight: bold;
                line-height: 1.2em;
                margin-top: 0em;
                margin-bottom: 0em;
                display: inline-block;
            }
            
            .overlay {
                max-width: unset;
                width: 500px;
                padding: 40px;
                border-radius: 20px;
                margin-top: 20px;
                margin-left: auto;
                margin-right: auto;
                background-color: #ffffff;
            }
            
            @media only screen and (min-width: 600px) {
                .overlay {
                    max-width: 500px;
                }
                h1 {
                    font-size: 3.5em;
                }
                .desktop {
                    display: initial !important;
                }
                .mobile {
                    display: none !important;
                }
            }
            
            a {
                text-decoration: none;
            }
            
            .button {
                padding: 10px;
                border-radius: 100px;
                background-color: #CADFE2;
                border-color: #2E3532;
                border-style: solid;
                border-width: 1px;
                transition: 0.2s;
                text-align: center;
                color: #2E3532;
            }
            
        </style>
    </head>
    
    <body>
    
        <div class="overlay">
            <h1>Hello 👋</h1>
            <p>Last step! Confirm your email.</p>
            <a target="_blank" href="${(process.env.DOMAINNAME || ('http://localhost:' + port)) + "/confirm/" + confirmationString}">
                <div class="button">confirm email!</button>
            </a>
        </div>

    </body>`

    }

    try {
        await transporter.sendMail(mailOptions);
        console.log("Message sent to: %s with confirmation string: %s", email, confirmationString);
        return true;
    } catch (error) {
        console.log("Error in sending mail" + error);
        return false;
    }

}


// Confirmation route
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