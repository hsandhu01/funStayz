'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Spots', [
      {
        ownerId: 1, 
        address: "123 Demo Street",
        city: "Demoville",
        state: "DemoState",
        country: "DemoCountry",
        lat: -123.4567,
        lng: 76.5432,
        name: "Demo Spot 1",
        description: "This is a demo spot.",
        price: 99.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
     
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Spots', null, {});
  }
};