// models/image.js
'use strict';

const { Model, Validator } = require('sequelize')

// module.exports = (sequelize, DataTypes) => {
//   const Image = sequelize.define('SpotImages', {
//     spotId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: 'Spots',
//         key: 'id'
//       }
//     },
//     url: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },
//     preview: {
//       type: DataTypes.BOOLEAN
//     }
//   }, {});
//   Image.associate = function(models) {
//     // associations can be defined here
//     Image.belongsTo(models.Spot, { foreignKey: 'spotId' });
//   };
//   return Image;
// };


module.exports = (sequelize, DataTypes) => {
  class SpotImage extends Model {
    static associate(models) {
      // association with User model (a Spot belongs to a User)
      SpotImage.belongsTo(models.Spot, { foreignKey: 'spotId'});

      // // User can have many Spots
      // User.hasMany(models.Spot, { foreignKey: 'ownerId', as: 'Spots' });
      // // User can have many Reviews
      // User.hasMany(models.Review, { foreignKey: 'userId', as: 'Reviews' });
    }
  };

  SpotImage.init(
    {
      spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Spots',
          key: 'id'
        }
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false
      },
      preview: {
        type: DataTypes.BOOLEAN
      },
      // username: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      //   validate: {
      //     len: [4, 30],
      //     isNotEmail(value) {
      //       if (Validator.isEmail(value)) {
      //         throw new Error("Cannot be an email.");
      //       }
      //     }
      //   }
      // },
      // email: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      //   unique: true, // Ensure email is unique
      //   validate: {
      //     len: [3, 256],
      //     isEmail: true
      //   }
      // },
      // hashedPassword: {
      //   type: DataTypes.STRING.BINARY,
      //   allowNull: false,
      //   validate: {
      //     len: [60, 60]
      //   }
      // },
      // firstName: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // },
      // lastName: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // }
    },
    {
      sequelize,
      modelName: 'SpotImage'
    }
  );

  return SpotImage;
};