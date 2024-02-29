const express = require('express');
const router = express.Router();
const { Spot } = require('../db/models'); // Adjust the path as necessary

// Get all spots
router.get('/', async (req, res) => {
  const spots = await Spot.findAll();
  res.json(spots);
});

// Create a spot
router.post('/', async (req, res) => {
  const { ownerId, address, city, state, country, lat, lng, name, description, price } = req.body;
  const spot = await Spot.create({
    ownerId, address, city, state, country, lat, lng, name, description, price
  });
  res.status(201).json(spot);
});



module.exports = router;