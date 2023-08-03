const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const { mapImage } = require("../mappers/images");

const schema = new mongoose.Schema({
  aboutMe: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 255,
  },
  avatar: Object,
  coverPhoto: Object,
  username: {
    type: String,
    maxlength: 50,
    minlength: 4,
    required: true,
    trim: true,
    unique: true,
  },
  name: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 50,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024,
    trim: true,
  },
  isAdmin: { type: Boolean, default: false },
  isVerified: {
    type: Boolean,
    default: function () {
      return this.isAdmin;
    },
  },
  otherAccounts: Object,
  timestamp: {
    type: Number,
    default: function () {
      return this._id.getTimestamp();
    },
  },
});

schema.methods.generateAuthToken = function () {
  const mappedAvatar = this.avatar ? mapImage(this.avatar) : this.avatar;

  return jwt.sign(
    {
      _id: this._id,
      avatar: mappedAvatar,
      isAdmin: this.isAdmin,
      isVerified: this.isVerified,
      name: this.name,
      username: this.username,
    },
    config.get("jwtPrivateKey")
  );
};

const User = mongoose.model("User", schema);

const validateUser = (user) =>
  Joi.object({
    aboutMe: Joi.string().min(3).max(255),
    avatar: Joi.object().optional(),
    coverPhoto: Joi.object().optional(),
    name: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(1024).required(),
    username: Joi.string().min(4).max(50).required(),
    whatsapp: Joi.string().min(12).max(13).required(),
  }).validate(user);

exports.User = User;
exports.validate = validateUser;
exports.schema = schema;
