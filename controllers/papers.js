const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const prisma = new PrismaClient();

const bucketName = process.env.AWS_S3_BUCKET;
const bucketRegion = process.env.AWS_S3_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const uploadPaper = async (req, res) => {
  const { title, abstract, keywords, conferenceId } = req.body;
  const coAuthors = JSON.parse(req.body.coAuthors);
  const paperFile = req.file;
  const fileParams = {
    Bucket: bucketName,
    Key: `papers/${Date.now()}-${paperFile.originalname}`,
    Body: paperFile.buffer,
    ContentType: paperFile.mimeType,
  };

  try {
    if (!title || !abstract || !keywords || keywords.length < 0) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }
    const putObjectCommand = new PutObjectCommand(fileParams);
    const fileLocation = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileParams.Key}`;
    await s3.send(putObjectCommand);

    const newPaper = await prisma.paper.create({
      data: {
        title,
        abstract,
        authorId: req.user.userId,
        conferenceId: parseInt(conferenceId) || conferenceId,
        fileURL: fileLocation,
        keywords: {
          create: JSON.parse(keywords).map((word) => ({ word })),
        },
      },
    });

    const coAuthorWithIds = await Promise.all(
      coAuthors.map(async (coAuthor) => {
        const foundUser = await prisma.user.findUnique({
          where: { email: coAuthor.email },
        });
        return { ...coAuthor, id: foundUser.id };
      })
    );

    await prisma.coAuthorship.createMany({
      data: coAuthorWithIds.map((coAuthor) => ({
        userId: coAuthor.id,
        paperId: newPaper.id,
      })),
    });

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

    const mappedReviewer = await getBestMatchingReviewer(newPaper, reviewers);

    await prisma.paper.update({
      where: { id: newPaper.id },
      data: {
        reviewerId: mappedReviewer.id,
      },
    });
    res.status(200).json({
      message: "Paper uploaded successfully",
      result: { paperId: newPaper.id, mapped_reviwer: mappedReviewer },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error uploading paper" });
  }
};

const getBestMatchingReviewer = async (paper, reviewers) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/reviewer-mapping",
      {
        paper,
        reviewers,
      }
    );

    return response.data;
  } catch (error) {
    console.log();
    // res.status(500).json({ message: "Error calling the api", error });
  }
};

const fetchPaperDetails = async (req, res) => {
  const userId = req.user.userId;
  try {
    const paper = await prisma.paper.findMany({
      where: { authorId: userId },
      include: {
        author: true,
        coAuthors: {
          include: {
            user: true,
          },
        },
        conference: true,
        keywords: true,
      },
    });
    if (!paper) {
      res.status(404).json({ message: "Paper not found" });
    }

    res
      .status(200)
      .json({ message: "Paper found successfully", result: paper });
  } catch (error) {
    res.status(500).json({ message: "Error fetching paper" });
  }
};

module.exports = { uploadPaper, fetchPaperDetails };
