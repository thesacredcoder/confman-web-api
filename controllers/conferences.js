const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { sendConferenceCreatedEmail } = require("../utils/mailer");

const createConference = async (req, res) => {
  const { name, description, startDate, endDate, status, organization } =
    req.body;

  try {
    const conference = await prisma.conference.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        organization,
        status,
        manager: { connect: { id: req.user.userId } },
      },
    });

    res
      .status(201)
      .json({ message: "Conference created successfully", conference });

    try {
      await sendConferenceCreatedEmail(
        req.user.email,
        req.user.name,
        conference.name
      );
    } catch (error) {
      console.error("Could not send email:", error);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating conference", error });
  }
};

const joinConference = async (req, res) => {
  const { conferenceId } = req.params;
  const { userId } = req.user;

  try {
    const conference = await prisma.conference.findFirst({
      where: { id: parseInt(conferenceId), status: "ONGOING" },
    });

    if (!conference) {
      return res
        .status(404)
        .json({ message: "Conference not found or not ongoing" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { conferences: { connect: { id: conference.id } } },
    });

    res.status(200).json({ message: "Conference joined successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error joining conference", error });
  }
};

const fetchAllConferences = async (req, res) => {
  const { userId } = req.user;
  try {
    const conferences = await prisma.conference.findMany();

    const userConf = await prisma.user.findMany({
      where: { id: userId },
      include: { conferences: true },
    });

    const userConfConferenceIds = userConf.flatMap((user) =>
      user.conferences.map((conference) => conference.id)
    );

    const filteredConferences = conferences.filter(
      (conference) => !userConfConferenceIds.includes(conference.id)
    );

    res.status(200).json({
      message: "Found all ongoing conferences",
      result: filteredConferences,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching conferences", error });
  }
};

const myConf = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        conferences: true,
      },
    });

    res.status(200).json({ message: "Found", result: user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching conferences", error });
  }
};

const createdConferenceList = async (req, res) => {
  const { userId } = req.user;
  try {
    const conferences = await prisma.conference.findMany({
      where: {
        managerId: userId,
      },
    });

    res
      .status(200)
      .json({ message: "Found the conferences", result: conferences });
  } catch (error) {
    res.status(500).json({ message: "Found the conferences", error });
  }
};

const updateConferenceDetails = async (req, res) => {
  const { id } = req.params;
  const managerId = req.user.userId;
  const { name, description, startDate, endDate, status, organization } =
    req.body;

  try {
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        status,
        manager: { connect: { id: managerId } },
      },
    });

    res.status(200).json({
      message: "Conference updated successfully",
      result: updatedConference,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating the conference", error });
  }
};

module.exports = {
  createConference,
  joinConference,
  fetchAllConferences,
  myConf,
  createdConferenceList,
  updateConferenceDetails,
};