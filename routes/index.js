var express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/ping', authMiddleware, (req, res) => {
  res.json({ success: true });
});


module.exports = router;
