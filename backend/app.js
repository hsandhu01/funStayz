const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');


const { environment } = require('./config');
const isProduction = environment === 'production';


const app = express();


app.use(morgan('dev'));


app.use(cookieParser());
app.use(express.json());

// Security Middlewares
if (!isProduction) {
  // Enable CORS only in development
  app.use(cors());
}


app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// CSRF protection
app.use(csurf({
  cookie: {
    secure: isProduction,
    sameSite: isProduction && "Lax",
    httpOnly: true
  }
}));


const routes = require('./routes');

// Connect rtes
app.use(routes);

// expirt app
module.exports = app;