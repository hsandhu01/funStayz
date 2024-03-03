'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Spot extends Model {
    static associate(models) {
      Spot.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
      Spot.hasMany(models.Review, { foreignKey: 'spotId', as: 'reviews' });
      Spot.hasMany(models.Booking, { foreignKey: 'spotId', as: 'bookings' });
      Spot.hasMany(models.SpotImage, { foreignKey: 'spotId', as: 'spotImages' });
    }
  }
  Spot.init({
    ownerId: DataTypes.INTEGER,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    lat: DataTypes.FLOAT,
    lng: DataTypes.FLOAT,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Spot',
  });
  return Spot;
};