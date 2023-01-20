const { Post } = require("../models/post");

module.exports = async (req, res, next) => {
  const { embeddedPostId } = req.body;

  if (embeddedPostId) {
    const post = await Post.findById(embeddedPostId);

    if (!post)
      return res.status(404).send("The post doesn't exist in the database");

    req.embeddedPost = post;
  }

  next();
};
