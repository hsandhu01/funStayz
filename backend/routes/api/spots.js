const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { Spot, SpotImage, Review, User, Booking, ReviewImage, } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const { handleValidationErrors } = require("../../utils/validation");
const { Op } = require("sequelize");
const { sequelize } = require("../../db/models");

const validateSpot = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city").exists({ checkFalsy: true }).withMessage("City is required"),
  check("lat")
    .exists({ checkFalsy: true })
    .withMessage("Latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  check("lng")
    .exists({ checkFalsy: true })
    .withMessage("Longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  check("name")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Name must be less than 50 characters"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check("price")
    .exists({ checkFalsy: true })
    .withMessage("Price per day is required")
    .isFloat({ min: 0 })
    .withMessage("Price per day must be a positive number"),
  handleValidationErrors,
];

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

const validateBooking = [
  check("startDate")
    .exists({ checkFalsy: true })
    .withMessage("Start date is required")
    .isISO8601("yyyy-mm-dd")
    .withMessage("startDate must be a valid date")
    .custom((startDate, { req }) => {
      const start = new Date(startDate);
      if (start < new Date()) {
        throw new Error("startDate cannot be in the past");
      }
      return true;
    }),
  check("endDate")
    .exists({ checkFalsy: true })
    .withMessage("End date is required")
    .isISO8601("yyyy-mm-dd")
    .withMessage("endDate must be a valid date")
    .custom((endDate, { req }) => {
      const end = new Date(endDate);
      const start = new Date(req.body.startDate);
      if (end <= start) {
        throw new Error("endDate cannot be on or before startDate");
      }
      return true;
    }),
  handleValidationErrors,
];

// Get all spots
router.get("/", async (req, res) => {
  const {
    page = 1,
    size = 20,
    minLat,
    maxLat,
    minLng,
    maxLng,
    minPrice,
    maxPrice,
  } = req.query;
  const errors = {};

  // Validate query parameters
  if (page < 1 || isNaN(page)) {
    errors.page = "Page must be greater than or equal to 1";
  }
  if (size < 1 || isNaN(size)) {
    errors.size = "Size must be greater than or equal to 1";
  }
  if (maxLat && isNaN(maxLat)) {
    errors.maxLat = "Maximum latitude is invalid";
  }
  if (minLat && isNaN(minLat)) {
    errors.minLat = "Minimum latitude is invalid";
  }
  if (minLng && isNaN(minLng)) {
    errors.minLng = "Minimum longitude is invalid";
  }
  if (maxLng && isNaN(maxLng)) {
    errors.maxLng = "Maximum longitude is invalid";
  }
  if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
    errors.minPrice = "Minimum price must be greater than or equal to 0";
  }
  if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
    errors.maxPrice = "Maximum price must be greater than or equal to 0";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Bad Request", errors });
  }

  try {
    const pagination = { offset: (page - 1) * size, limit: size };
    const where = {};

    // Add filtering conditions to the where clause
    if (minLat && maxLat) {
      where.lat = { [Op.between]: [minLat, maxLat] };
    } else {
      if (minLat) where.lat = { [Op.gte]: minLat };
      if (maxLat) where.lat = { [Op.lte]: maxLat };
    }

    if (minLng && maxLng) {
      where.lng = { [Op.between]: [minLng, maxLng] };
    } else {
      if (minLng) where.lng = { [Op.gte]: minLng };
      if (maxLng) where.lng = { [Op.lte]: maxLng };
    }

    if (minPrice && maxPrice) {
      where.price = { [Op.between]: [minPrice, maxPrice] };
    } else {
      if (minPrice) where.price = { [Op.gte]: minPrice };
      if (maxPrice) where.price = { [Op.lte]: maxPrice };
    }

    const spots = await Spot.findAll({
      include: [
        {
          model: Review,
          as: "Reviews",
          attributes: [],
        },
        {
          model: SpotImage,
          as: "SpotImages",
          attributes: ["url"],
          where: { preview: true },
          required: false,
        },
      ],
      where,
      ...pagination,
      attributes: {
        include: [
          [sequelize.fn("AVG", sequelize.col("Reviews.stars")), "avgRating"],
          [sequelize.col("SpotImages.url"), "previewImage"],
        ],
      },
      group: ["Spot.id", "SpotImages.id", "SpotImages.url"],
      subQuery: false,
    });

    res.status(200).json({ Spots: spots, page, size });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get spots owned by the current user
router.get("/current", requireAuth, async (req, res) => {
  const currentUserId = req.user.id;

  const spots = await Spot.findAll({
    where: { ownerId: currentUserId },
    include: [
      {
        model: Review,
        as: "Reviews",
        attributes: [],
      },
      {
        model: SpotImage,
        as: "SpotImages",
        attributes: [],
        where: { preview: true },
        required: false,
      },
    ],
    attributes: {
      include: [
        [sequelize.fn("AVG", sequelize.col("Reviews.stars")), "avgRating"],
        [sequelize.col("SpotImages.url"), "previewImage"],
      ],
    },
    group: ["Spot.id", "SpotImages.url"],
  });

  res.json({ Spots: spots });
});

// Get details of a spot from an id
router.get("/:spotId", async (req, res) => {
  const spotId = parseInt(req.params.spotId, 10);
  if (isNaN(spotId)) {
    return res.status(400).json({ message: "Invalid spot ID" });
  }

  const spot = await Spot.findByPk(spotId, {
    include: [
      {
        model: Review,
        as: 'Reviews',
        attributes: [],
      },
      {
        model: SpotImage,
        as: 'SpotImages',
        attributes: ['id', 'url', 'preview'],
      },
      {
        model: User,
        as: 'Owner',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
    attributes: {
      include: [
        [sequelize.fn('COUNT', sequelize.col('Reviews.id')), 'numReviews'],
        [sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgStarRating'],
      ],
    },
    group: ['Spot.id', 'SpotImages.id', 'Owner.id'],
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  res.json(spot);
});

// Create a spot
router.post("/", requireAuth, validateSpot, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const ownerId = req.user.id;

  try {
    const spot = await Spot.create({
      ownerId,
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    res.status(201).json(spot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add an image to a spot based on the spot's id
router.post("/:spotId/images", requireAuth, async (req, res) => {
  const spotId = parseInt(req.params.spotId, 10);
  if (isNaN(spotId)) {
    return res.status(400).json({ message: "Invalid spot ID" });
  }

  const { url, preview } = req.body;
  const ownerId = req.user.id;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== ownerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const image = await SpotImage.create({ spotId, url, preview });

  res.json({
    id: image.id,
    url: image.url,
    preview: image.preview,
  });
});

// Edit a spot
router.put("/:spotId", requireAuth, validateSpot, async (req, res) => {
  const spotId = parseInt(req.params.spotId, 10);
  if (isNaN(spotId)) {
    return res.status(400).json({ message: "Invalid spot ID" });
  }

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const ownerId = req.user.id;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== ownerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await spot.update({
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  res.json(spot);
});

// Delete a spot
router.delete("/:spotId", requireAuth, async (req, res) => {
  const spotId = parseInt(req.params.spotId, 10);
  if (isNaN(spotId)) {
    return res.status(400).json({ message: "Invalid spot ID" });
  }

  const ownerId = req.user.id;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== ownerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await spot.destroy();

  res.json({ message: "Successfully deleted" });
});

// Get all reviews by a spot's id
router.get("/:spotId/reviews", async (req, res) => {
  const spotId = parseInt(req.params.spotId, 10);
  if (isNaN(spotId)) {
    return res.status(400).json({ message: "Invalid spot ID" });
  }

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const reviews = await Review.findAll({
    where: { spotId },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
      },
    ],
  });

  res.json({ Reviews: reviews });
});

// Create a review for a spot based on the spot's id
router.post(
  "/:spotId/reviews",
  requireAuth,
  validateReview,
  async (req, res) => {
    const spotId = parseInt(req.params.spotId, 10);
    if (isNaN(spotId)) {
      return res.status(400).json({ message: "Invalid spot ID" });
    }

    const { review, stars } = req.body;
    const userId = req.user.id;

    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const existingReview = await Review.findOne({
      where: {
        spotId,
        userId,
      },
    });

    if (existingReview) {
      return res.status(403).json({
        message: "User already has a review for this spot",
      });
    }

    const newReview = await Review.create({
      spotId,
      userId,
      review,
      stars,
    });

    res.status(201).json(newReview);
  }
);

// Edit a review
router.put("/:reviewId", requireAuth, validateReview, async (req, res) => {
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
  const { review: reviewText, stars } = req.body;
  await review.update({ review: reviewText, stars });
  res.json(review);
});

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

// Get all bookings for a spot based on the spot's id
router.get("/:spotId/bookings", requireAuth, async (req, res) => {
  const spotId = parseInt(req.params.spotId, 10);
  if (isNaN(spotId)) {
    return res.status(400).json({ message: "Invalid spot ID" });
  }
  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }
  if (spot.ownerId === req.user.id) {
    // If the user is the owner of the spot, return all bookings with user information
    const bookings = await Booking.findAll({
      where: { spotId },
      include: {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
    });
    res.json({ Bookings: bookings });
  } else {
    // If the user is not the owner of the spot, return all bookings without user information
    const bookings = await Booking.findAll({
      where: { spotId },
      attributes: [
        "id",
        "spotId",
        "startDate",
        "endDate",
        "createdAt",
        "updatedAt",
      ],
    });
    res.json({ Bookings: bookings });
  }
});

// Create a booking from a spot based on the spot's id
router.post(
  "/:spotId/bookings",
  requireAuth,
  validateBooking,
  async (req, res) => {
    const spotId = parseInt(req.params.spotId, 10);
    if (isNaN(spotId)) {
      return res.status(400).json({ message: "Invalid spot ID" });
    }
    const { startDate, endDate } = req.body;
    const userId = req.user.id;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    if (spot.ownerId === userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const conflictingBooking = await Booking.findOne({
      where: {
        spotId,
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            endDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            startDate: {
              [Op.lte]: startDate,
            },
            endDate: {
              [Op.gte]: endDate,
            },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return res.status(403).json({
        message: "Sorry, this spot is already booked for the specified dates",
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking",
        },
      });
    }
    
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          endDate: "endDate cannot be on or before startDate",
        },
      });
    }

    const booking = await Booking.create({
      spotId,
      userId,
      startDate,
      endDate,
    });

    res.json(booking);
  }
);

module.exports = router;
