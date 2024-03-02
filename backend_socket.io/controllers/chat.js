const UserS = require("../dbschema/UserSchema");

const chat = async (req, res) => {
  try {
    const players = await UserS.find({});
    if (players) res.status(200).send(players);
    else res.status(200).send("We have no Users");
  } catch (e) {
    console.log(e);
    res.status(200).send("Error");
  }
};

const sendMessage = (req, res) => {
  var message = new Message(req.body);
  io.emit("message", req.body);
  res.sendStatus(200);
};
module.exports = { chat, sendMessage };
