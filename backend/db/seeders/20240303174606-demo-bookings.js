'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Bookings', [
      {
        userId: 1, 
        spotId: 1,
        startDate: new Date(), 
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)), 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 2, 
        spotId: 2, 
        startDate: new Date(new Date().setDate(new Date().getDate() + 8)), 
        endDate: new Date(new Date().setDate(new Date().getDate() + 15)), 
        createdAt: new Date(),
        updatedAt: new Date()
      },
     
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};