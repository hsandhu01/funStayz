'use strict';
module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Spots',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    review: {
      type: DataTypes.TEXT
    }
  }, {});
  Review.associate = function(models) {
    // associations can be defined here
    Review.belongsTo(models.Spot, { foreignKey: 'spotId' });
    Review.belongsTo(models.User, { foreignKey: 'userId' });
    Review.hasMany(models.ReviewImage, { foreignKey: 'reviewId' });
  };
  return Review;
};