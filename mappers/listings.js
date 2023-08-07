const fs = require("fs");
const config = require("config");

const { Category } = require("../models/category");
const { User } = require("../models/user");

const outputFolder = "public/assets/";

const mapImage = (imageUrl) => `${config.get("assetsBaseUrl")}${imageUrl}`;

const mapListing = async (listing) => {
  const author = await User.findById(listing.authorId);
  const category = await Category.findById(listing.categoryId);

  author.password = "";
  listing.author = author;
  listing.category = category;
  listing.images = listing.images.map(mapImage);

  return listing;
};

const mapListings = async (listings) =>
  await Promise.all(listings.map(mapListing));

const imageUnmapper = (listing) =>
  listing.images.forEach(async (image) => {
    if (image?.fileName) {
      fs.unlinkSync(`${outputFolder}${image.fileName}_full.jpg`);
      fs.unlinkSync(`${outputFolder}${image.fileName}_thumb.jpg`);
    }
  });

const mapAvatar = (avatar) => (avatar ? mapImage(avatar) : avatar);

module.exports = {
  imageUnmapper,
  mapAvatar,
  mapListing,
  mapListings,
};
