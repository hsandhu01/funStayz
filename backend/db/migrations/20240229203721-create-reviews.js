'use strict';

let options = {};
if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
    options.schema = process.env.SCHEMA;  
}

module.exports = {
    async up(queryInterface, Sequelize) {
        
        await queryInterface.createTable('Reviews', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: {
                        tableName: 'Users',
                        schema: options.schema
                    },
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            spotId: {
                type: Sequelize.INTEGER,
                references: {
                    model: {
                        tableName: 'Spots',
                        schema: options.schema
                    },
                    key: 'id'
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            review: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            stars: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }, options);  
    },

    async down(queryInterface, Sequelize) {
        
        await queryInterface.dropTable({ tableName: 'Reviews', ...options });
    }
};