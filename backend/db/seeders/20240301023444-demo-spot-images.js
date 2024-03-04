'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('SpotImages', [
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
      },
      
    ], {});
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.bulkDelete('SpotImages', null, {});
  }
};