const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const handlebars = require('handlebars');
const fs = require('fs');
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((error, token) => {
            if (error) {
                reject("Failed to create access token :(");
            }
            resolve(token);
        });
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL,
            accessToken,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    });

    return transporter;
}

const sendEmail = async (emailOptions) => {
    const emailTransporter = await createTransporter();
    emailTransporter.sendMail(emailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return error;
        }
        console.log(`Email sent: ${info.response}`);
    });
}

const signUpTemplate = handlebars.compile(fs.readFileSync('./templates/signupEmail.hbs', 'utf8'));
const conferenceCreatedTemplate = handlebars.compile(fs.readFileSync('./templates/conferenceCreatedEmail.hbs', 'utf8'));
const paperSubmittedTemplate = handlebars.compile(fs.readFileSync('./templates/paperSubmittedEmail.hbs', 'utf8'));

const sendSignUpEmail = async (email, name) => {
    const emailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Welcome to Confman",
        html: signUpTemplate({ name })
    };
    await sendEmail(emailOptions);
}

const sendConferenceCreatedEmail = async (email, name, conferenceName) => {
    const emailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Conference created",
        html: conferenceCreatedTemplate({ name, conferenceName })
    };
    await sendEmail(emailOptions);
}

const sendPaperSubmittedEmail = async (detailsOfAuthors, conferenceName, paperDetails) => {
    if (!Array.isArray(detailsOfAuthors)) {
        detailsOfAuthors = [detailsOfAuthors];
    } 
    for (let i = 0; i < detailsOfAuthors.length; i++) {
        const emailOptions = {
            from: process.env.EMAIL,
            to: detailsOfAuthors[i].email,
            subject: "Paper submitted",
            html: paperSubmittedTemplate({ authorName: detailsOfAuthors[i].name, conferenceName, ...paperDetails })
        };
        await sendEmail(emailOptions);
    }
}


module.exports = {
    sendSignUpEmail,
    sendConferenceCreatedEmail,
    sendPaperSubmittedEmail
}