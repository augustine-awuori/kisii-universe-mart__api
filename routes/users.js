const _ = require("lodash");
const { isValidObjectId } = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const multer = require("multer");
const router = express.Router();

const { checkPhoneNumber } = require("../utility/whatsapp");
const { mapUser } = require("../mappers/users");
const { saveImage } = require("../utility/storage");
const { User, validate } = require("../models/user");
const auth = require("../middleware/auth");
const validateUser = require("../middleware/validateUser");
const validator = require("../middleware/validate");
const service = require("../services/users");

const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  [upload.single("avatar"), validator(validate)],
  async (req, res) => {
    const username = req.body.username;
    let user = await service.findOne({ username });
    if (user)
      return res.status(400).send({ error: `${username} is already taken.` });

    user = new User(_.pick(req.body, ["name", "username", "password"]));
    const salt = await bcrypt.genSalt(10);
    if (req.file) user.avatar = req.file?.filename;
    user.password = await bcrypt.hash(user.password, salt);
    user.otherAccounts = { whatsapp: checkPhoneNumber(req.body.whatsapp) };

    if (req.file) await saveImage(req.file);
    await user.save();

    res
      .header("x-auth-token", user.generateAuthToken())
      .header("access-control-expose-headers", "x-auth-token")
      .send(_.pick(user, ["_id", "name", "username", "isAdmin", "isVerified"]));
  }
);

router.get("/", async (_req, res) => {
  const users = await service.getAll();

  res.send(users);
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;
  if (!isValidObjectId(userId))
    return res.status(400).send({ error: "Invalid ID." });

  const user = await service.findById(userId);
  if (!user)
    return res
      .status(404)
      .send({ error: "The user with the given ID does not exist." });

  res.send(user);
});

router.patch(
  "/",
  [auth, validateUser, upload.array("images", process.env.userImagesCount)],
  async (req, res) => {
    const { aboutMe, name, instagram, twitter, whatsapp, username } = req.body;
    let user = await service.exists(req.user._id);

    if (!user)
      return res.status(404).send({ error: "You're not in the database" });

    if (isEdited(aboutMe)) user.aboutMe = aboutMe;
    if (user.username !== username) {
      const userByUsername = await User.findOne({ username });
      if (userByUsername)
        return res.status(400).send({ error: `${username} is already taken.` });
    }
    if (isEdited(name)) user.name = name;
    if (isEdited(username)) user.username = username;
    const accounts = user.otherAccounts;
    if (isEdited(whatsapp) || isEdited(instagram) || isEdited(twitter)) {
      user.otherAccounts = {
        whatsapp: whatsapp || accounts.whatsapp,
        instagram: instagram || accounts.instagram,
        twitter: twitter || accounts.twitter,
      };
    }

    await user.save();

    res.send({ token: user.generateAuthToken(), user: mapUser(user) });
  }
);

function isEdited(property) {
  return property !== undefined;
}

module.exports = router;
