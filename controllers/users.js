const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const { sendSignUpEmail } = require("../utils/mailer");

const prisma = new PrismaClient();

const signUp = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(404).json({ message: "User exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { email: newUser.email, userId: newUser.id, role: newUser.role },
      "password",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true });

    res
      .status(201)
      .json({ message: "User created successfully", data: newUser });

    try {
      await sendSignUpEmail(email, name);
    } catch (error) {
      console.error("Could not send email:", error);
    }
    
  } catch (error) {
    console.error("Error in signUpController:", error);
    return res.status(500).json({ message: "An error occurred during signup" });
  }
};

const signUpReviewer = async (req, res) => {
  try {
    const { email, password, name, role, expertises } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(404).json({ message: "User exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
        expertises: {
          create: expertises.map((expertise) => ({ name: expertise })),
        },
      },
    });

    const token = jwt.sign(
      { email: newUser.email, userId: newUser.id, role: newUser.role },
      "password",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { sameSite: "none" });

    res
      .status(201)
      .json({ message: "User created successfully", data: newUser });
  } catch (error) {
    console.error("Error in signUpController:", error);
    return res.status(500).json({ message: "An error occurred during signup" });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (role !== existingUser.role) {
      return res.status(401).json({
        message: "Incorrect role",
        error: `You need to signup as a ${role}`,
      });
    }

    const token = jwt.sign(
      {
        email: existingUser.email,
        userId: existingUser.id,
        role: existingUser.role,
      },
      "password",
      { expiresIn: "1h" }
    );

    res.cookie("token", token);

    res
      .status(200)
      .json({ message: "User signed in successfully", data: existingUser });
  } catch (error) {
    console.error("Error in signInController:", error);
    return res.status(500).json({ message: "An error occurred during signin" });
  }
};

const userDetails = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error in userDetails route:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching user details" });
  }
};

const logoutUser = async (req, res) => {
  res.clearCookie("token");

  res.status(200).json({ message: "Logged out successfully" });
};

const getAllReviewers = async (req, res) => {
  try {
    const reviewers = await prisma.user.findMany({
      where: { role: "REVIEWER" },
      select: {
        id: true,
        name: true,
        email: true,
        expertises: {
          select: {
            name: true,
          },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Fetched all the reviewers", result: reviewers });
  } catch (error) {
    console.error("Error fetching reviewers:", error);
    res.status(500).json({ message: "Error fetching reviewers" });
  }
};

module.exports = {
  signUp,
  signin,
  userDetails,
  logoutUser,
  getAllReviewers,
  signUpReviewer,
};