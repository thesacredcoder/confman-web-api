const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoute = require("./routes/users");
const conferenceRoute = require("./routes/conferences");
const paperRoute = require("./routes/papers");
const reviewerRoute = require("./routes/reviewer");

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/users", userRoute);
app.use("/conferences", conferenceRoute);
app.use("/papers", paperRoute);
app.use("/reviewers", reviewerRoute);

const port = 4000;

app.get("/health-check", (req, res) => {
  res.json({ status: true, message: "Server is up and running" });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
