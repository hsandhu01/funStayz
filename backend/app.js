const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
// Import spotsRouter
const spotsRouter = require('./routes/spots');

const { environment } = require('./config');
const isProduction = environment === 'production';

const app = express();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

if (!isProduction) {
  app.use(cors());
}

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(csurf({
  cookie: {
    secure: isProduction,
    sameSite: isProduction && "Lax",
    httpOnly: true
  }
}));

// Use the spots router for routes starting with /api/spots
app.use('/api/spots', spotsRouter);

// Continue with the rest of your routes
const routes = require('./routes');
app.use(routes);

// Resource not found error handler
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = "Resource Not Found";
  err.errors = { "message": "The requested resource couldn't be found." };
  err.status = 404;
  next(err);
});

// Sequelize handling errors
const { ValidationError } = require('sequelize');
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    const errors = {};
    err.errors.forEach(error => {
      errors[error.path] = error.message;
    });
    err.title = 'Validation error';
    err.errors = errors;
    err.status = 400;
  }
  next(err);
});

// Errors
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  console.error(err);
  res.json({
    title: err.title || 'Server Error',
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack
  });
});

module.exports = app;