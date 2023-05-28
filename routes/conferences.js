const {
  createConference,
  joinConference,
  fetchAllConferences,
  myConf,
  createdConferenceList,
  updateConferenceDetails,
} = require("../controllers/conferences");
const isAuthenticated = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole");

const router = require("express").Router();

router.post("/create", isAuthenticated, checkRole("MANAGER"), createConference);
router.post(
  "/join/:conferenceId",
  isAuthenticated,
  checkRole("AUTHOR"),
  joinConference
);
router.get("/allOngoing", isAuthenticated, fetchAllConferences);
router.get("/myConf", isAuthenticated, checkRole("AUTHOR"), myConf);
router.get(
  "/fetchCreated",
  isAuthenticated,
  checkRole("MANAGER"),
  createdConferenceList
);
router.put(
  "/update/:id",
  isAuthenticated,
  checkRole("MANAGER"),
  updateConferenceDetails
);

module.exports = router;
