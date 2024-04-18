const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { Spot, SpotImage, Review, User, Booking } = require('../../db/models');
const { requireAuth, restoreUser } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize');



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

// Get bookings owned by user
router.get('/current', requireAuth, async (req, res) => {
  const currentUserId = req.user.id;

  const bookings = await Booking.findAll({
    where: { userId: currentUserId },
    include: [
      {
        model: Spot,
        attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price', 'previewImage']
      }
    ]
  });

  res.json({ Bookings: bookings });
});

// Edit a booking
router.put('/:bookingId', requireAuth, validateBooking, async (req, res, next) => {
  const { bookingId } = req.params;
  const { startDate, endDate } = req.body;
  const currentUserId = req.user.id;

  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }

    if (booking.userId !== currentUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (new Date(endDate) <= new Date()) {
      return res.status(403).json({
        message: "Past bookings can't be modified",
        errors: {
          endDate: "End date cannot be in the past"
        }
      });
    }

    const conflictingBooking = await Booking.findOne({
      where: {
        id: { [Op.not]: bookingId },
        spotId: booking.spotId,
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] }
          },
          {
            endDate: { [Op.between]: [startDate, endDate] }
          },
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: endDate }
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

    await booking.update({ startDate, endDate });

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Delete a booking
router.delete('/:bookingId', requireAuth, async (req, res, next) => {
  const { bookingId } = req.params;
  const currentUserId = req.user.id;

  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }

    if (booking.userId !== currentUserId) {
      const spot = await Spot.findByPk(booking.spotId);
      if (!spot || spot.ownerId !== currentUserId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (new Date(booking.startDate) <= new Date()) {
      return res.status(403).json({
        message: "Bookings that have been started can't be deleted",
        errors: {
          startDate: "Booking has already started and cannot be deleted"
        }
      });
    }

    await booking.destroy();

    res.json({ message: "Successfully deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
