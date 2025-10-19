import config from '../config.js';
import { Sequelize } from 'sequelize';
const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASSWORD,
  {
    host: config.DB_HOST,
    port: config.DB_HOST,
    dialect: config.DB_DIALECT,
    charset: config.DB_CHARSET,
    collate: config.DB_COLLATE,
    define:{
      timestamps: true,
      underscored: false,
    },
    logging: false
  }
)
export default sequelize;