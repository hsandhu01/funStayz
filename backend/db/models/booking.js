'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // association with User model (a Spot belongs to a User)
      Booking.belongsTo(models.Spot, { foreignKey: 'spotId'});
      Booking.belongsTo(models.User, { foreignKey: 'userId'});

    }
  }

  Booking.init({
    spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Spots', key: 'id' }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    startDate: DataTypes.DATE,
    endDate: DataTypes.DATE,

    
  }, {
    sequelize,
    modelName: 'Booking',
  });

  return Booking;
};