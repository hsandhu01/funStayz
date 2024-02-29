const express = require('express');
const router = express.Router();
const { Spot, Image, Review, User } = require('../db/models');
const { requireAuth } = require('../utils/auth'); 

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
router.get('/current', requireAuth, async (req, res) => {
  const currentUserId = req.user.id; 
  const ownerSpots = await Spot.findAll({
    where: { ownerId: currentUserId }
  });
  res.json({ Spots: ownerSpots });
});

// get spot details from id
router.get('/:spotId', async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    include: [
      {
        model: Review,
        attributes: []
      },
      {
        model: Image,
        as: 'SpotImages'
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

// create spot
router.post('/', requireAuth, async (req, res, next) => {
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
router.post('/:spotId/images', requireAuth, async (req, res, next) => {
  const { url, preview } = req.body;
  const { spotId } = req.params;

  // check if spot is in right spot

  try {
    const image = await Image.create({ spotId, url, preview });
    return res.status(200).json(image);
  } catch (e) {
    next(e);
  }
});

// edit spot
router.put('/:spotId', requireAuth, async (req, res, next) => {
  const { address, city, state, country, lat, lng, name, description, price } = req.body;
  const spot = await Spot.findByPk(req.params.spotId);

  if (spot) {
    try {
      await spot.update({ address, city, state
, country, lat, lng, name, description, price });
return res.json(spot);
} catch (e) {
next(e);
}
} else {
return res.status(404).json({ message: "Spot couldn't be found" });
}
});

// del spot
router.delete('/:spotId', requireAuth, async (req, res, next) => {
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