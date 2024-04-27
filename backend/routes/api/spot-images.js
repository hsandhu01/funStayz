const express = require('express');
const router = express.Router();
const { SpotImage, Spot } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

// Delete a spot image
router.delete('/:imageId', requireAuth, async (req, res) => {
  const imageId = parseInt(req.params.imageId, 10);
  if (isNaN(imageId)) {
    return res.status(400).json({ message: 'Invalid image ID' });
  }

  const image = await SpotImage.findByPk(imageId);

  if (!image) {
    return res.status(404).json({ message: "Spot Image couldn't be found" });
  }

  const spot = await Spot.findByPk(image.spotId);

  if (!spot || spot.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await image.destroy();

  res.json({ message: 'Successfully deleted' });
});


module.exports = router;