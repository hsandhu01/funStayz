const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { Spot, SpotImage, Review, User, Booking } = require('../../db/models'); 
const { requireAuth , restoreUser} = require('../../utils/auth'); 
const { handleValidationErrors } = require('../../utils/validation');



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

// get bookings owned by user
router.get('/current', restoreUser,requireAuth, async (req, res) => {
    const currentUserId = req.user.id; 
    const ownerBookings = await Booking.findAll({
      where: { userId: currentUserId }
    });

    res.json({ Bookings: ownerBookings });
});


// edit booking
router.put('/:bookingId', restoreUser, requireAuth, validateBooking, async (req, res, next) => {
    const { startDate, endDate} = req.body;
    const bookingId = req.params.bookingId;
    const currentUserId = req.user.id;

    try {
        // Retrieve the booking by its ID
        const booking = await Booking.findByPk(bookingId);
        
        // If booking is not found, return a 404 status with a corresponding message
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
    
        // Check if the authenticated user is the owner of the booking
        if (booking.userId !== currentUserId) {
          return res.status(403).json({ message: "You are not authorized to update this booking" });
        }
    
        // Update the booking details
        await booking.update({ startDate, endDate });
    
        // Return the updated booking as a response
        res.json(booking);
      } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ message: "Internal server error" });
      }
});
  

module.exports = router;