"use strict";
/* jshint node: true */

var mongoose = require("mongoose");

/**
 * Define the Mongoose Schema for a Comment.
 */
var userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  location: String,
  description: String,
  occupation: String,
  login_name: String,
  password: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo", default: [] }]
});

/**
 * Create a Mongoose Model for a User using the userSchema.
 */
var User = mongoose.model("User", userSchema);

/**
 * Make this available to our application.
 */
module.exports = User;