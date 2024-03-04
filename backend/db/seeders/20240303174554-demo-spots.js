"use strict";

const { Spot } = require("../models");
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
module.exports = {
  async up(queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: "3 anywhere road",
        city: "milkyways",
        state: "space",
        country: "galaxy",
        lat: 20,
        lng: 35,
        name: "harrys spot",
        description: "love this place",
        price: 902.99,
        numReviews: 6,
        avgRating: 5
      },
      {
        ownerId: 2,
        address: "4 anywhere road",
        city: "milkyways",
        state: "space",
        country: "galaxy",
        lat: 100,
        lng: -20,
        name: "harrys spot2",
        description: "loving this place",
        price: 650.50,
        numReviews: 1,
        avgRating: 4
      },
      {
        ownerId: 3,
        address: "5 anywhere road",
        city: "milkyway",
        state: "space",
        country: "galaxy",
        lat: 105,
        lng: -30,
        name: "another of harrys spots",
        description: "hey it is decent",
        price: 309.20,
        numReviews: 1,
        avgRating: 5
      },
    ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      name: { [Op.in]: ['harrys spot', 'harrys spot2', 'another of harrys spots'] }
    }, {});
  }
};