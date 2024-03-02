const mongoose = require("mongoose");

const msgSchema = new mongoose.Schema({
  sender: {
    type: String,
  },
  receiver: {
    type: String,
  },
  OfflineMessage: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("MsgSC", msgSchema);
