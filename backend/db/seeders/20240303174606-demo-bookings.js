'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Bookings', [
      {
        spotId: 1, 
        userId: 1, 
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)), 
        createdAt: new Date(),
        updatedAt: new Date()
      },
    
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Bookings', null, {});
  }
};
