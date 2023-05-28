const router = require("express").Router();
const multer = require("multer");

const isAuthenticated = require("../middleware/authenticate");
const { uploadPaper, fetchPaperDetails } = require("../controllers/papers");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

router.post("/upload", isAuthenticated, upload.single("paper"), uploadPaper);
router.get("/fetch", isAuthenticated, fetchPaperDetails);

module.exports = router;
