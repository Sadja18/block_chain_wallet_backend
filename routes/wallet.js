const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const walletCtrl = require("../controllers/walletController");

router.post("/create", authMiddleware, walletCtrl.createWallet);
router.post("/import", authMiddleware, walletCtrl.importWallet);
router.get("/balance", authMiddleware, walletCtrl.getBalance);
router.post("/balance", authMiddleware, walletCtrl.getBalance);

router.post("/send", authMiddleware, walletCtrl.sendTransaction);
router.post("/get", authMiddleware, walletCtrl.getMyWallets);

module.exports = router;
