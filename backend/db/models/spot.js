// models/spot.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    static associate(models) {
      // association with User model (a Spot belongs to a User)
      Spot.belongsTo(models.User, { foreignKey: 'ownerId', as: 'Owner' });

      // association with Image model (a Spot can have many Images)
      Spot.hasMany(models.SpotImage, { foreignKey: 'spotId', as: 'SpotImage' });

      // association with Review model (a Spot can have many Reviews)
      Spot.hasMany(models.Review, { foreignKey: 'spotId', as: 'Reviews' });
    }
  }

  Spot.init({
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    lat: DataTypes.FLOAT,
    lng: DataTypes.FLOAT,
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    avgRating: {
      type: DataTypes.FLOAT,
    },
    previewImage: DataTypes.STRING 
  }, {
    sequelize,
    modelName: 'Spot',
  });

  return Spot;
};