'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Spots', [{
      ownerId: 1, 
      address: '123 Example St',
      city: 'Example City',
      state: 'Example State',
      country: 'Example Country',
      lat: 34.0522,
      lng: -118.2437,
      name: 'Example Spot',
      description: 'This is an example spot.',
      price: 100.00,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Spots', null, {});
  }
};