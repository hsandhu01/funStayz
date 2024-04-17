const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { Spot, SpotImage, Review, User, Booking, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize');
const { sequelize } = require('../../db/models');

const validateSpot = [
  check('address')
    .exists({ checkFalsy: true })
    .withMessage('Street address is required'),
  check('city')
    .exists({ checkFalsy: true })
    .withMessage('City is required'),
  check('state')
    .exists({ checkFalsy: true })
    .withMessage('State is required'),
  check('country')
    .exists({ checkFalsy: true })
    .withMessage('Country is required'),
  check('lat')
    .exists({ checkFalsy: true })
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be within -90 and 90'),
  check('lng')
    .exists({ checkFalsy: true })
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be within -180 and 180'),
  check('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Name must be less than 50 characters'),
  check('description')
    .exists({ checkFalsy: true })
    .withMessage('Description is required'),
  check('price')
    .exists({ checkFalsy: true })
    .withMessage('Price per day is required')
    .isFloat({ min: 0 })
    .withMessage('Price per day must be a positive number'),
  handleValidationErrors,
];

const validateReview = [
  check('review')
    .exists({ checkFalsy: true })
    .withMessage('Review text is required'),
  check('stars')
    .exists({ checkFalsy: true })
    .withMessage('Stars are required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be an integer from 1 to 5'),
  handleValidationErrors,
];

const validateBooking = [
  check('startDate')
    .exists({ checkFalsy: true })
    .withMessage('Start date is required')
    .isISO8601('yyyy-mm-dd')
    .withMessage('startDate must be a valid date')
    .custom((startDate, { req }) => {
      const start = new Date(startDate);
      if (start < new Date()) {
        throw new Error('startDate cannot be in the past');
      }
      return true;
    }),
  check('endDate')
    .exists({ checkFalsy: true })
    .withMessage('End date is required')
    .isISO8601('yyyy-mm-dd')
    .withMessage('endDate must be a valid date')
    .custom((endDate, { req }) => {
      const end = new Date(endDate);
      const start = new Date(req.body.startDate);
      if (end <= start) {
        throw new Error('endDate cannot be on or before start date');
      }
      return true;
    }),
  handleValidationErrors,
];

// format dates
const formatDate = (date) => {
  if (!date) return null; // Guard against null values
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// for the rating
const getAverageRating = (reviews) => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, { rating }) => acc + rating, 0);
  return (sum / reviews.length).toFixed(2);
};

// Get all spts
router.get('/', async (req, res) => {
  const { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;
  const errors = {};

  // validate query parameters
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

    // filtering conditions to the where clause
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
          as: 'Reviews',
          attributes: []
        },
        {
          model: SpotImage,
          as: 'SpotImages',
          attributes: ['url'],
          where: { preview: true },
          required: false
        }
      ],
      where,
      ...pagination,
      attributes: {
        include: [
          [sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgRating'],
          [sequelize.col('SpotImages.url'), 'previewImage']
        ]
      },
      group: ['Spot.id', 'SpotImages.url'], 
      subQuery: false
    });

    res.status(200).json({ Spots: spots, page, size });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get spots owned by the current user
router.get('/current', requireAuth, async (req, res) => {
  const currentUserId = req.user.id;

  const spots = await Spot.findAll({
    where: { ownerId: currentUserId },
    include: [
      {
        model: Review,
        as: 'Reviews',
        attributes: [],
      },
      {
        model: SpotImage,
        as: 'SpotImages',
        attributes: [],
        where: { preview: true },
        required: false
      }
    ],
    attributes: {
      include: [
        [sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgRating'],
        [sequelize.col('SpotImages.url'), 'previewImage']
      ]
    },
    group: ['Spot.id', 'SpotImages.url']
  });

  res.json({ Spots: spots });
});


// Get details of a spot from an id
router.get('/:spotId', async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    include: [
      {
        model: Review,
        as: 'Reviews',
        attributes: []
      },
      {
        model: SpotImage,
        as: 'SpotImages', 
        attributes: ['id', 'url', 'preview']
      },
      {
        model: User,
        as: 'Owner',
        attributes: ['id', 'firstName', 'lastName']
      }
    ],
    attributes: {
      include: [
        [sequelize.fn('COUNT', sequelize.col('Reviews.id')), 'numReviews'],
        [sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgStarRating']
      ]
    },
    group: ['Spot.id', 'SpotImages.id', 'Owner.id']
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  res.json(spot);
});

// Create a spot
router.post('/', requireAuth, validateSpot, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } = req.body;
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
      price
    });

    res.status(201).json(spot);
  } catch (error) {
    next(error);
  }
});

// Add an image to a spot based on the spot's id
router.post('/:spotId/images', requireAuth, async (req, res) => {
  const { spotId } = req.params;
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
    preview: image.preview
  });
});

// Edit a spot
router.put('/:spotId', requireAuth, validateSpot, async (req, res) => {
  const { spotId } = req.params;
  const { address, city, state, country, lat, lng, name, description, price } = req.body;
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
    price
  });

  res.json(spot);
});

// Delete a spot
router.delete('/:spotId', requireAuth, async (req, res) => {
  const { spotId } = req.params;
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
router.get('/:spotId/reviews', async (req, res) => {
  const { spotId } = req.params;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const reviews = await Review.findAll({
    where: { spotId },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: ReviewImage,
        attributes: ['id', 'url']
      }
    ]
  });

  res.json({ Reviews: reviews });
});

// Create a review for a spot based on the spot's id
router.post('/:spotId/reviews', requireAuth, validateReview, async (req, res) => {
  const { spotId } = req.params;
  const { review, stars } = req.body;
  const userId = req.user.id;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const existingReview = await Review.findOne({
    where: {
      spotId,
      userId
    }
  });

  if (existingReview) {
    return res.status(500).json({
      message: "User already has a review for this spot",
      errors: {
        review: "User already has a review for this spot"
      }
    });
  }

  const newReview = await Review.create({
    spotId,
    userId,
    review,
    stars
  });

  res.status(201).json(newReview);
});


// Get all bookings for a spot based on the spot's id
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const userId = req.user.id;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId === userId) {
    // if the user is the owner of the spot return all bookings with user information
    const bookings = await Booking.findAll({
      where: { spotId },
      include: {
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }
    });

    res.json({ Bookings: bookings });
  } else {
    // if the user is not the owner of the spot return all bookings without user information
    const bookings = await Booking.findAll({
      where: { spotId },
      attributes: ['spotId', 'startDate', 'endDate']
    });

    res.json({ Bookings: bookings });
  }
});

// Create a booking from a spot based on the spot's id
router.post('/:spotId/bookings', requireAuth, validateBooking, async (req, res) => {
  const { spotId } = req.params;
  const { startDate, endDate } = req.body;
  const userId = req.user.id;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const conflictingBooking = await Booking.findOne({
    where: {
      spotId,
      [Op.or]: [
        {
          startDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        {
          endDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        {
          startDate: {
            [Op.lte]: startDate
          },
          endDate: {
            [Op.gte]: endDate
          }
        }
      ]
    }
  });

  if (conflictingBooking) {
    return res.status(403).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        startDate: "Start date conflicts with an existing booking",
        endDate: "End date conflicts with an existing booking"
      }
    });
  }

  const booking = await Booking.create({
    spotId,
    userId,
    startDate,
    endDate
  });

  res.json(booking);
});


// Delete a spot image
router.delete('/spot-images/:imageId', requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const ownerId = req.user.id;

  const image = await SpotImage.findByPk(imageId);

  if (!image) {
    return res.status(404).json({ message: "Spot Image couldn't be found" });
  }

  const spot = await Spot.findByPk(image.spotId);

  if (!spot || spot.ownerId !== ownerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await image.destroy();

  res.json({ message: "Successfully deleted" });
});


// Delete a review image
router.delete('/review-images/:imageId', requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const userId = req.user.id;

  const image = await ReviewImage.findByPk(imageId);

  if (!image) {
    return res.status(404).json({ message: "Review Image couldn't be found" });
  }

  const review = await Review.findByPk(image.reviewId);

  if (!review || review.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await image.destroy();

  res.json({ message: "Successfully deleted" });
});


module.exports = router;