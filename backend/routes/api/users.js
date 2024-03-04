const express = require('express');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');
const { handleValidationErrors } = require('../../utils/validation');

// our router instance
const router = express.Router();

// validation signup for middle ware
const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Please provide a valid email.'),
    check('username')
      .exists({ checkFalsy: true })
      .isLength({ min: 4 })
      .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
      .not()
      .isEmail()
      .withMessage('Username cannot be an email.'),
    check('password')
      .exists({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password must be 6 characters or more.'),
    check('firstName')
      .exists({ checkFalsy: true })
      .withMessage('First name is required.'),
    check('lastName')
      .exists({ checkFalsy: true })
      .withMessage('Last name is required.'),
    handleValidationErrors,

];

// sign up
router.post('/', validateSignup, async (req, res) => {

    const { email, password, username, firstName, lastName } = req.body;

    // Check if the email already exists
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
        return res.status(500).json({
            message: "User already exists",
            errors: {
                email: "User with that email already exists"
            }
        });
    }

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
        return res.status(500).json({
            message: "Username already exists",
            errors: {
                username: "User with that username already exists"
            }
        });
    }


    const hashedPassword = bcrypt.hashSync(password);
    const user = await User.create({ email, username, hashedPassword, firstName, lastName });

    setTokenCookie(res, user);

    return res.json({
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
        }
    });
});

// for loging in route
router.post('/session', async (req, res, next) => {
    const { credential, password } = req.body;

    const user = await User.findOne({
        where: {
            username: credential,
        }
    });

    if (user && bcrypt.compareSync(password, user.hashedPassword.toString())) {
        setTokenCookie(res, user);
        return res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            }
        });
    } else {
        const err = new Error('Login failed');
        err.status = 401;
        err.title = 'Login failed';
        err.errors = ['The provided credentials were invalid.'];
        return next(err);
    }
});

//get route
router.get('/session', restoreUser, (req, res) => {
    const { user } = req;
    if (user) {
        return res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            }
        });
    } else {
        return res.json({ user: null });
    }
});


module.exports = router;