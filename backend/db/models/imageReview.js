'use strict';
const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReviewImage extends Model {
    static associate(models) {
     
      ReviewImage.belongsTo(models.Review, { foreignKey: 'reviewId' });
    }
  }

  ReviewImage.init(
    {
      reviewId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Reviews',
          key: 'id',
        },
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
    },
    {
      sequelize,
      modelName: 'ReviewImage',
    }
  );

  return ReviewImage;
};