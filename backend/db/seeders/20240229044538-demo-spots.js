'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    let options = {};
    
    if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
      options.schema = process.env.SCHEMA; 
    }

    await queryInterface.bulkInsert({
      tableName: 'Spots',
      ...options
    }, [
      {
        ownerId: 1, 
        address: '1234 Sandhu St',
        city: 'Whatever City',
        state: 'Whatever State',
        country: 'Whatever Country',
        lat: 34.0522,
        lng: -118.2437,
        name: 'First Demo Spot',
        description: 'This is the first demo spot for seeding.',
        price: 99.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ownerId: 1, 
        address: '5678 Sandhu Rd',
        city: 'Whatever City',
        state: 'Whatever State',
        country: 'Whatever Country',
        lat: 40.7128,
        lng: -74.0060,
        name: 'Second Demo Spot',
        description: 'This is the second demo spot for seeding.',
        price: 149.99,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    let options = {};
    
    if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
      options.schema = process.env.SCHEMA;
    }

    return queryInterface.bulkDelete({
      tableName: 'Spots',
      ...options
    }, null, {});
  }
};