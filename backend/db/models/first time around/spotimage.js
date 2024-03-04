'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SpotImage extends Model {
    static associate(models) {
      // define association here
      SpotImage.belongsTo(models.Spot, { foreignKey: 'spotId' });
    }
  };

  SpotImage.init({
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Spots', key: 'id' }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true 
      }
    },
    preview: {
      type: DataTypes.BOOLEAN
    }
  }, {
    sequelize,
    modelName: 'SpotImage',
  });

  return SpotImage;
};