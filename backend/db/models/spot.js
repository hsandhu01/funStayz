'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    static associate(models) {
      // association with User model (a Spot belongs to a User)
      Spot.belongsTo(models.User, { foreignKey: 'ownerId', as: 'Owner' });

      // association with Image model (a Spot can have many Images)
      Spot.hasMany(models.SpotImage, { foreignKey: 'spotId', as: 'SpotImages' });

      // association with Review model (a Spot can have many Reviews)
      Spot.hasMany(models.Review, { foreignKey: 'spotId', as: 'Reviews' });
    }
  }

  Spot.init({
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  }, {
    sequelize,
    modelName: 'Spot',
  });

  return Spot;
};