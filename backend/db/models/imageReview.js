'use strict';

const { Model, Validator } = require('sequelize')


module.exports = (sequelize, DataTypes) => {
  class ReviewImage extends Model {
    static associate(models) {
      // association with User model (a Spot belongs to a User)
      ReviewImage.belongsTo(models.Review, { foreignKey: 'reviewId'});

      // // User can have many Spots
      // User.hasMany(models.Spot, { foreignKey: 'ownerId', as: 'Spots' });
      // // User can have many Reviews
      // User.hasMany(models.Review, { foreignKey: 'userId', as: 'Reviews' });
    }
  };

  ReviewImage.init(
    {
      reviewId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Review',
          key: 'id'
        }
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      sequelize,
      modelName: 'ReviewImage'
    }
  );

  return ReviewImage;
};