const router = require('express').Router();

const { register, login,getUser } = require('../controller/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/user',authMiddleware, getUser);

module.exports = router;