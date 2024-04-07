const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { Spot, SpotImage, Review, User, Booking } = require('../../db/models');
const { requireAuth, restoreUser } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize');

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

// Format dates
const formatDate = (date) => {
    if (!date) return null; // Guard against null values
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// For the rating
const getAverageRating = (reviews) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, { rating }) => acc + rating, 0);
    return (sum / reviews.length).toFixed(2);
};

// GET /api/spots
router.get('/', async (req, res, next) => {
  // pull query parameters with default values
  const { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

  // page and size to integers
  const limit = parseInt(size, 10);
  const offset = (page - 1) * limit;

  // for filtering
  const where = {};
  if (minLat) where.lat = { [Op.gte]: parseFloat(minLat) };
  if (maxLat) where.lat = { ...where.lat, [Op.lte]: parseFloat(maxLat) };
  if (minLng) where.lng = { [Op.gte]: parseFloat(minLng) };
  if (maxLng) where.lng = { ...where.lng, [Op.lte]: parseFloat(maxLng) };
  if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
  if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };

  try {
    
    const spots = await Spot.findAll({
      where,
      limit,
      offset,
      // i may need to add more here
    });

    // return response with spots data and pagination info
    res.json({
      Spots: spots,
      page: parseInt(page, 10),
      size: limit,
    });
  } catch (error) {
    next(error); // errors to the error handler
  }
});

// Get spots owned by user
router.get('/current', restoreUser, requireAuth, async (req, res) => {
  const currentUserId = req.user.id;
  const ownerSpots = await Spot.findAll({
      where: { ownerId: currentUserId },
      attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt'],
      include: [
          {
              model: SpotImage,
              as: 'previewImage',
              attributes: ['url'],
              limit: 1,
          },
      ],
  });

  const formattedSpots = ownerSpots.map((spot) => ({
      ...spot.toJSON(),
      previewImage: spot.previewImage ? spot.previewImage.url : null,
  }));

  res.json({ Spots: formattedSpots });
});

// Get spot details from id
router.get('/:spotId', async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId, {
      attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt'],
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
  });

  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const responseData = spot.toJSON();
  responseData.numReviews = await Review.count({ where: { spotId: spot.id } });
  responseData.avgStarRating = await Review.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('stars')), 'avgRating']],
      where: { spotId: spot.id },
      raw: true,
  }).then((result) => result.avgRating);

  res.json(responseData);
});

// Get all reviews by spot id
router.get('/:spotId/reviews', async (req, res, next) => {
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
              attributes: ['id', 'firstName', 'lastName'],
          },
          {
              model: ReviewImage,
              attributes: ['id', 'url'],
          },
      ],
  });

  res.json({ Reviews: reviews });
});

// Get all bookings for a spot by id
router.get('/:spotId/bookings', restoreUser, requireAuth, async (req, res) => {
  const spotId = req.params.spotId;
  const userId = req.user.id;

  const spot = await Spot.findByPk(spotId);
  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  let bookings;
  if (spot.ownerId === userId) {
      bookings = await Booking.findAll({
          where: { spotId },
          include: {
              model: User,
              attributes: ['id', 'firstName', 'lastName'],
          },
      });
  } else {
      bookings = await Booking.findAll({
          where: { spotId },
          attributes: ['spotId', 'startDate', 'endDate'],
      });
  }

  res.json({ Bookings: bookings });
});

// Create a spot
router.post('/', restoreUser, requireAuth, validateSpot, async (req, res, next) => {
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
          price,
      });
      res.status(201).json(spot);
  } catch (error) {
      next(error);
  }
});

// Add an image to a spot
router.post('/:spotId/images', restoreUser, requireAuth, async (req, res, next) => {
  const { url, preview } = req.body;
  const { spotId } = req.params;
  const userId = req.user.id;

  const spot = await Spot.findByPk(spotId);
  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
  }

  try {
      const image = await SpotImage.create({ spotId, url, preview });
      res.json({
          id: image.id,
          url: image.url,
          preview: image.preview,
      });
  } catch (error) {
      next(error);
  }
});

// Create a review for a spot
router.post('/:spotId/reviews', restoreUser, requireAuth, validateReview, async (req, res) => {
  const { spotId } = req.params;
  const { review, stars } = req.body;
  const userId = req.user.id;

  const spot = await Spot.findByPk(spotId);
  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const existingReview = await Review.findOne({ where: { userId, spotId } });
  if (existingReview) {
      return res.status(500).json({ message: "User already has a review for this spot" });
  }

  const newReview = await Review.create({ userId, spotId, review, stars });
  res.status(201).json(newReview);
});

// Create a booking for a spot
router.post('/:spotId/bookings', restoreUser, requireAuth, validateBooking, async (req, res) => {
  const { spotId } = req.params;
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
                  startDate: { [Op.between]: [startDate, endDate] },
              },
              {
                  endDate: { [Op.between]: [startDate, endDate] },
              },
              {
                  [Op.and]: [
                      { startDate: { [Op.lte]: startDate } },
                      { endDate: { [Op.gte]: endDate } },
                  ],
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

  const newBooking = await Booking.create({ userId, spotId, startDate, endDate });
  res.json(newBooking);
});

// Edit a spot
router.put('/:spotId', restoreUser, requireAuth, validateSpot, async (req, res, next) => {
  const { address, city, state, country, lat, lng, name, description, price } = req.body;
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
  }

  try {
      await spot.update({ address, city, state, country, lat, lng, name, description, price });
      res.json(spot);
  } catch (error) {
      next(error);
  }
});

// Delete a spot
router.delete('/:spotId', restoreUser, requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const spot = await Spot.findByPk(spotId);

  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
  }

  await spot.destroy();
  res.json({ message: "Successfully deleted" });
});

// Delete a spot image
router.delete('/spot-images/:imageId', requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const image = await SpotImage.findByPk(imageId);

  if (!image) {
      return res.status(404).json({ message: "Spot Image couldn't be found" });
  }

  const spot = await Spot.findByPk(image.spotId);
  if (!spot || spot.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
  }

  await image.destroy();
  res.json({ message: "Successfully deleted" });
});

// Delete a review image
router.delete('/review-images/:imageId', requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const image = await ReviewImage.findByPk(imageId);

  if (!image) {
      return res.status(404).json({ message: "Review Image couldn't be found" });
  }

  const review = await Review.findByPk(image.reviewId);
  if (!review || review.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
  }

  await image.destroy();
  res.json({ message: "Successfully deleted" });
});

module.exports = router;