const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { Review, Spot, User, ReviewImage } = require('../../db/models');
const { requireAuth, restoreUser } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation');


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

// this is to check ownership
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

// get all reviews of user current
router.get('/current', restoreUser, requireAuth, async (req, res) => {
    const userId = req.user.id;
    const reviews = await Review.findAll({
        where: { userId },
        include: [
            { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName'] },
            { model: Spot, as: 'Spot', attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price', 'previewImage'] },
            { model: ReviewImage, as: 'ReviewImages', attributes: ['id', 'url'] }
        ]
    });
    res.json({ Reviews: reviews });
});

// get all reviews on spot id
router.get('/spots/:spotId/reviews', async (req, res) => {
    const { spotId } = req.params;
    const reviews = await Review.findAll({
        where: { spotId },
        include: [
            { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName'] },
            { model: Image, as: 'ReviewImages', attributes: ['id', 'url'] }
        ]
    });
    res.json({ Reviews: reviews });
});

//// create review based on id
// router.post('/spots/:spotId/reviews', restoreUser, requireAuth, validateReview, async (req, res) => {
//     const { spotId } = req.params;
//     const { review, stars } = req.body;
//     const userId = req.user.id;

//     // check on existence of spot
//     const spot = await Spot.findByPk(spotId);
//     if (!spot) {
//         return res.status(404).json({ message: "Spot couldn't be found" });
//     }

//     // check if reviewed already
//     const existingReview = await Review.findOne({ where: { userId, spotId } });
//     if (existingReview) {
//         return res.status(500).json({ message: "User already has a review for this spot" });
//     }

//     const newReview = await Review.create({ userId, spotId, review, stars });
//     res.status(201).json(newReview);
// });

// add image review on review id
router.post('/:reviewId/images', restoreUser, requireAuth, checkReviewOwnership, async (req, res) => {
    const { url } = req.body;
    const { reviewId } = req.params;

    // max images limit to 10
    const images = await ReviewImage.findAll({ where: { reviewId } });
    if (images.length >= 10) {
        return res.status(403).json({ message: "Maximum number of images for this resource was reached" });
    }

    const image = await ReviewImage.create({ reviewId, url });
    res.status(200).json(image);
});

// edit review
router.put('/:reviewId', restoreUser, requireAuth, checkReviewOwnership, validateReview ,async (req, res) => {
    const { review, stars } = req.body;
    await req.review.update({ review, stars });
    res.json(req.review);
});

// del review
router.delete('/:reviewId', restoreUser, requireAuth, checkReviewOwnership, async (req, res) => {
    await req.review.destroy();
    res.json({ message: "Successfully deleted" });
});

module.exports = router;