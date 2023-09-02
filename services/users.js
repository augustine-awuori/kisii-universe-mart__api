const { User } = require("../models/user");
const { mapUser, mapUsers } = require("../mappers/users");

const findOne = async (filter = {}) => await User.findOne(filter);

const findById = async (id) => {
  const user = await User.findById(id);

  return user ? mapUser(user) : user;
};

const getAll = async (filter = {}) => {
  const users = await User.find(filter);

  return mapUsers(users);
};

module.exports = { findById, findOne, getAll };
