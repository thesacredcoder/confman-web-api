const router = require("express").Router();

const { fetchPaper } = require("../controllers/reviewers");
const isAuthenticated = require("../middleware/authenticate");

// router.get("/fetch/:reviewerId/papers", isAuthenticated, fetchPaper);
router.get("/fetch/papers", isAuthenticated, fetchPaper);

module.exports = router;
