const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { Spot, SpotImage, Review, User, Booking } = require('../../db/models'); 
const { requireAuth , restoreUser} = require('../../utils/auth'); 
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
    handleValidationErrors
];


const validateBooking = [
  check('startDate')
  .exists({ checkFalsy: true })
  .withMessage('Start date is required')
  .isISO8601('yyyy-mm-dd')
  .withMessage('startDate must be a valid date')
  .custom((startDate, { req }) => {
    const start = new Date(startDate)

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
  handleValidationErrors
];



// for the rating
const getAverageRating = (reviews) => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, { rating }) => acc + rating, 0);
  return (sum / reviews.length).toFixed(2);
};

// get all spots
router.get('/', async (req, res) => {
  const spots = await Spot.findAll();
  res.json({ Spots: spots });
});

// get spots owned by suer
router.get('/current', restoreUser,requireAuth, async (req, res) => {
  const currentUserId = req.user.id; 
  const ownerSpots = await Spot.findAll({
    where: { ownerId: currentUserId }
  });
  res.json({ Spots: ownerSpots });
});

// get spot details from id
router.get('/:spotId', async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    // include: [
    //   {
    //     model: Review,
    //     attributes: []
    //   },
    //   {
    //     model: Image,
    //     as: 'SpotImages'
    //   },
    //   {
    //     model: User,
    //     as: 'Owner',
    //     attributes: ['id', 'firstName', 'lastName']
    //   }
    // ]

    include: [
      {
        model: Review,
        as: 'Reviews', // Use the alias specified in the association
        attributes: []
      },
      {
        model: SpotImage,
        as: 'SpotImage'
      },
      {
        model: User,
        as: 'Owner',
        attributes: ['id', 'firstName', 'lastName']
      }
    ]

  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const responseData = spot.toJSON();
  const reviews = await spot.getReviews();
  responseData.avgRating = getAverageRating(reviews);
  responseData.numReviews = reviews.length;
  
  res.json(responseData);
});


router.get('/:spotId/reviews', async (req, res, next) => {
  const { spotId } = req.params;

  try {
    // Find the spot
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Find all reviews for the spot
    const reviews = await Review.findAll({ where: { spotId } });
    
    // Return the reviews
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});


router.get('/:spotId/bookings', restoreUser, requireAuth, async (req, res) => {
  const spotId = req.params.spotId;
  const userId = req.user.id; // Get the ID of the authenticated user

  try {
    // Retrieve all bookings associated with the spotId
    const bookings = await Booking.findAll({ where: { spotId: spotId } });

    // If there are no bookings found, return a 404 status with a corresponding message
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this spot" });
    }

    // Check if the authenticated user is the owner of the spot
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    // If the authenticated user is the owner of the spot, return detailed booking information
    if (spot.ownerId === userId) {
      const detailedBookings = await Booking.findAll({ where: { spotId: spotId }, include: User });

      return res.status(200).json({ Bookings: detailedBookings });
    }

    // If the authenticated user is not the owner of the spot, return basic booking information
    return res.status(200).json({ Bookings: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// create spot
router.post('/', restoreUser, requireAuth, async (req, res, next) => {
  const { address, city, state, country, lat, lng, name, description, price } = req.body;
  const ownerId = req.user.id; 

  try {
    const spot = await Spot.create({
      ownerId, address, city, state, country, lat, lng, name, description, price
    });
    return res.status(201).json(spot);
  } catch (e) {
    next(e); 
  }
});


// add image based on spot id
router.post('/:spotId/images', restoreUser,requireAuth, async (req, res, next) => {
  const { url, preview } = req.body;
  const { spotId } = req.params;

  // check if spot is in right spot

  try {
    const image = await SpotImage.create({ spotId, url, preview });
    return res.status(200).json(image);
  } catch (e) {
    next(e);
  }
});


// create review based on id
router.post('/:spotId/reviews', restoreUser, requireAuth, validateReview, async (req, res) => {
  const { spotId } = req.params;
  const { review, stars } = req.body;
  const userId = req.user.id;

  // check on existence of spot
  const spot = await Spot.findByPk(spotId);
  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  // check if reviewed already
  const existingReview = await Review.findOne({ where: { userId, spotId } });
  if (existingReview) {
      return res.status(500).json({ message: "User already has a review for this spot" });
  }

  const newReview = await Review.create({ userId, spotId, review, stars });
  res.status(201).json(newReview);
});


// create review based on id
router.post('/:spotId/bookings', restoreUser, requireAuth, validateBooking, async (req, res) => {
  const { spotId } = req.params;
  const { startDate, endDate } = req.body;
  const userId = req.user.id;

  // check on existence of spot
  const spot = await Spot.findByPk(spotId);
  if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const bookingExists = await Booking.findOne({
    where: {
      spotId,
      [Op.or]: [
        {
          startDate: { [Op.between]: [startDate, endDate] }
        },
        {
          endDate: { [Op.between]: [startDate, endDate] }
        },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } }
          ]
        }
      ]
    }
  });



  if (bookingExists.length >0 ) {
    return res.status(400).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        startDate: "Start date conflicts with an existing booking",
        endDate: "End date conflicts with an existing booking"
      }
    });
  }

  const newBooking = await Booking.create({ userId, spotId, startDate, endDate });
  res.status(200).json(newBooking);
});

// edit spot
router.put('/:spotId', restoreUser, requireAuth, validateSpot, async (req, res, next) => {
  const { address, city, state, country, lat, lng, name, description, price } = req.body;
  const spot = await Spot.findByPk(req.params.spotId);

  if (spot && spot.ownerId == req.user.id) {

    try {
      await spot.update({ address, city, state, country, lat, lng, name, description, price });
      return res.json(spot);
    } catch (e) {
      next(e);
    }
  } else {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }
});

// del spot
router.delete('/:spotId', restoreUser, requireAuth, async (req, res, next) => {
const spot = await Spot.findByPk(req.params.spotId);

if (!spot) {
return res.status(404).json({ message: "Spot couldn't be found" });
}

// check on spots

try {
await spot.destroy();
return res.json({ message: "Successfully deleted" });
} catch (e) {
next(e);
}
});

module.exports = router;