const {
  signUp,
  signin,
  userDetails,
  logoutUser,
  getAllReviewers,
  signUpReviewer,
} = require("../controllers/users");
const isAuthenticated = require("../middleware/authenticate");

const router = require("express").Router();

router.post("/signup", signUp);
router.post("/signin", signin);
router.get("/user-details", isAuthenticated, userDetails);
router.delete("/logout", logoutUser);
router.get("/getReviewers", getAllReviewers);
router.post("/signupReviewer", signUpReviewer);

module.exports = router;
