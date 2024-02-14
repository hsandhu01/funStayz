const express = require('express');
const router = express.Router();
const apiRouter = require('./api');

router.use('/api', apiRouter);
// ...
// CSRF token restoration route
router.get('/api/csrf/restore', (req, res) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.status(200).json({
    'XSRF-Token': req.csrfToken()
  });
});

module.exports = router;