'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // association with User model (a Booking belongs to a User)
      Booking.belongsTo(models.User, { foreignKey: 'userId' });

      // association with Spot model (a Booking belongs to a Spot)
      Booking.belongsTo(models.Spot, { foreignKey: 'spotId' });
    }
  }

  Booking.init({
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Spots', key: 'id' },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterStartDate(value) {
          if (value <= this.startDate) {
            throw new Error('endDate must be after startDate');
          }
        },
      },
    },
  }, {
    sequelize,
    modelName: 'Booking',
  });

  return Booking;
};