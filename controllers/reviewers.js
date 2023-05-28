const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fetchPaper = async (req, res) => {
  //   const reviewerId = parseInt(req.params.reviewerId);
  const reviewerId = parseInt(req.user.userId);

  try {
    const assignedPapers = await prisma.paper.findMany({
      where: {
        reviewerId: reviewerId,
      },
    });

    res.status(200).json({ result: assignedPapers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error  fetching papers" });
  }
};

module.exports = { fetchPaper };
