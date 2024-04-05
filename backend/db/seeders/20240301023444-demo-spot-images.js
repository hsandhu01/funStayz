'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    let options = {};
    
    if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
      options.schema = process.env.SCHEMA;
    }

    await queryInterface.bulkInsert({
      tableName: 'SpotImages',
      ...options
    }, [
      {
        spotId: 1, 
        url: 'https://sandhu.com/image1.jpg',
        preview: true, 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        spotId: 1, 
        url: 'https://sandhu.com/image2.jpg',
        preview: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    let options = {};
    
    if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
      options.schema = process.env.SCHEMA;
    }

    return queryInterface.bulkDelete({
      tableName: 'SpotImages',
      ...options
    }, null, {});
  }
};