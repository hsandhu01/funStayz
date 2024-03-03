'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Review.belongsTo(models.Spot, { foreignKey: 'spotId', as: 'spot' });
      Review.hasMany(models.ReviewImage, { foreignKey: 'reviewId', as: 'reviewImages' });
    }
  }
  Review.init({
    userId: DataTypes.INTEGER,
    spotId: DataTypes.INTEGER,
    review: DataTypes.TEXT,
    stars: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};