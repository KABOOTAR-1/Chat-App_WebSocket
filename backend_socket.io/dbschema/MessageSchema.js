const mongoose = require("mongoose");

// Message content schema
const messageContentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  delivered: {
    type: Boolean,
    default: false,
  }
}, { _id: false });

// Main message schema
const msgSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  messages: {
    type: [messageContentSchema],
    default: [],
  },
  OfflineMessage: {
    type: [String],
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for efficient querying
msgSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model("MsgSC", msgSchema);
