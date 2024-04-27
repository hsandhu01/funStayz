const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { Review, Spot, User, ReviewImage } = require("../../db/models");
const { requireAuth, restoreUser } = require("../../utils/auth");
const { handleValidationErrors } = require("../../utils/validation");

const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .withMessage("Stars are required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Stars must be an integer from 1 to 5"),
  handleValidationErrors,
];

const checkReviewOwnership = async (req, res, next) => {
  const review = await Review.findByPk(req.params.reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }
  if (review.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }
  req.review = review;
  next();
};

// Get all reviews of the current user
router.get("/current", requireAuth, async (req, res) => {
  const currentUserId = req.user.id;

  const reviews = await Review.findAll({
    where: { userId: currentUserId },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: Spot,
        attributes: [
          "id",
          "ownerId",
          "address",
          "city",
          "state",
          "country",
          "lat",
          "lng",
          "name",
          "price",
          "previewImage",
        ],
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
      },
    ],
  });

  res.json({ Reviews: reviews });
});

// Add an image to a review based on the review's id
router.post("/:reviewId/images", requireAuth, async (req, res, next) => {
  const reviewId = parseInt(req.params.reviewId, 10);
  if (isNaN(reviewId)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  try {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const imageCount = await ReviewImage.count({ where: { reviewId } });
    if (imageCount >= 10) {
      return res.status(403).json({
        message: "Maximum number of images for this resource was reached",
        errors: {
          review:
            "Cannot add any more images because there is a maximum of 10 images per resource",
        },
      });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        message: "URL is required",
      });
    }

    const image = await ReviewImage.create({ reviewId, url });
    res.json({ id: image.id, url: image.url });
  } catch (error) {
    next(error);
  }
});

// Edit a review
router.put(
  "/:reviewId",
  requireAuth,
  validateReview,
  async (req, res, next) => {
    const { reviewId } = req.params;
    const { review, stars } = req.body;
    const userId = req.user.id;

    try {
      const existingReview = await Review.findByPk(reviewId);

      if (!existingReview) {
        return res.status(404).json({ message: "Review couldn't be found" });
      }

      if (existingReview.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await existingReview.update({ review, stars });

      res.json(existingReview);
    } catch (error) {
      next(error);
    }
  }
);

// Delete a review
router.delete("/:reviewId", requireAuth, async (req, res) => {
  const reviewId = parseInt(req.params.reviewId, 10);
  if (isNaN(reviewId)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  const review = await Review.findByPk(reviewId);

  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (review.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await review.destroy();

  res.json({ message: "Successfully deleted" });
});

module.exports = router;
