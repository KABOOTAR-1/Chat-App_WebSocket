const express = require("express");
const { chat, sendMessage } = require("../controllers/chat");

const router = express.Router();

router.route("/").get(chat);
//router.route("/message").post(sendMessage);

module.exports = router;
