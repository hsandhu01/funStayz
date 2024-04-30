const express = require('express');
const router = express.Router();
const { ReviewImage, Review } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

// Delete a review image
router.delete('/:imageId', requireAuth, async (req, res) => {
  const imageId = parseInt(req.params.imageId, 10);
  if (isNaN(imageId)) {
    return res.status(400).json({ message: 'Invalid image ID' });
  }

  const image = await ReviewImage.findByPk(imageId);

  if (!image) {
    return res.status(404).json({ message: "Review Image couldn't be found" });
  }

  const review = await Review.findByPk(image.reviewId);

  if (!review || review.userId !== req.user.id) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  await image.destroy();

  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
