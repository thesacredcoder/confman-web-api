const { sendEmailUtil } = require('../utils/mailer');

const sendEmail = async (req, res) => {
    const { email, subject, text } = req.body;

    const emailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: subject,
        text: text
    };

    try {
        await sendEmailUtil(emailOptions);
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error sending email" });
    }
}

module.exports = { sendEmail };