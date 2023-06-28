const { sendEmail } = require('../controllers/mailer')
const router = require("express").Router();

router.post("/sendEmail", sendEmail);

module.exports = router;