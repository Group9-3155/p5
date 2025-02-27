'use strict';

/*
 * A simple Node.js program for exporting the current working directory via a webserver listing
 * on a hard code (see portno below) port. To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:3001 will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 */

/* jshint node: true */

var express = require('express');

var portno = 3000;   // Port number to use

var app = express();

var models = require('./modelData/photoApp.js').models;

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

app.get('/', function (request, response) {
  response.send('Simple web server of files from ' + __dirname);
});

app.get('/test/:p1', function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params objects.
  var param = request.params.p1;
  console.log('/test called with param1 = ', param);
  if (param !== "info") {
    console.error("Nothing to be done for param: ", param);
    response.status(400).send('Not found');
    return;
  }
  
  var info = models.schemaInfo();
  
  // Query didn't return an error but didn't find the SchemaInfo object - This
  // is also an internal error return.
  if (info.length === 0) {
    response.status(500).send('Missing SchemaInfo');
    return;
  }
  response.status(200).send(info);
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
  response.status(200).send(models.userListModel());
  return;
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
  var id = request.params.id;
  var user = models.userModel(id);
  if (user === null) {
    console.log('User with _id:' + id + ' not found.');
    response.status(400).send('Not found');
    return;
  }
  response.status(200).send(user);
  return;
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
  var id = request.params.id;
  var photos = models.photoOfUserModel(id);
  if (photos.length === 0) {
    console.log('Photos for user with _id:' + id + ' not found.');
    response.status(400).send('Not found');
    return;
  }
  response.status(200).send(photos);
});


var server = app.listen(portno, function () {
  var port = server.address().port;
  console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});

const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");

/* Project 6 Additions to webServer.js - 
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code port.
 * It also establishes a connection to the MongoDB named 'project6'. */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const async = require("async");
const express = require("express");
const app = express();

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.static(__dirname));
app.get("/", function (request, response) {
  response.send("Simple web server of files from" + __dirname)
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 * 
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get("/test/:p1", function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /user/info:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object -
        // This is also an internal error return.
        response.status(400).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an
    // async call to each collections. That is tricky to do so we use the async
    // package do the work. We put the collections into array and use async.each
    // to do each .count() query.
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count;
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          const obj = {};
          for (let i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400)
    // status.
    response.status(400).send("Bad param " + param);
  }
});

/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", function (request, response) {
  User.find({}, {_id: 1, first_name: 1, last_name: 1}, function (err, users) {
    if (err) {
      // Query returned an error.
      console.error("Error in /user/list", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    if (users.length === 0) {
      // Query did not return an error, but could not find SchemaInfo object.
      response.status(400).send();
      return;
    }
    response.end(JSON.stringify(users));
  });
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get("/user/:id", function (request, response) {
  const id = request.params.id;
  User.find({_id: {$eq: id}},{__v:0}, function (err, user) {
    if (err) {
      // Query returned an error. We pass it back to the browser with an
      // Internal Service Error (500) error code.
      console.error("Error in /user/:id", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    if (user.length === 0) {
      // Query didn't return an error but didn't find the SchemaInfo object -
      // This is also an internal error return.
      response.status(400).send();
      return;
    }
    // We got the object - return it in JSON format.
    response.end(JSON.stringify(user[0]));
  });
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", function (request, response) {
  const id = request.params.id;
  Photo.aggregate([
    { $match:
          {user_id: {$eq: new mongoose.Types.ObjectId(id)}}
    },
    { $addFields: {
      comments: { $ifNull : ["$comments", []] }
    } },
    { $lookup: {
        from: "users",
        localField: "comments.user_id",
        foreignField: "_id",
        as: "users"
      } },
    { $addFields: {
        comments: {
          $map: {
            input: "$comments",
            in: {
              $mergeObjects: [
                "$$this",
                { user: {
                    $arrayElemAt: [
                      "$users",
                      {
                        $indexOfArray: [
                          "$users._id",
                          "$$this.user_id"
                        ]
                      }
                    ]
                  } }
              ]
            }
          }
        }
      } },
    { $project: {
        users: 0,
        __v: 0,
        "comments.__v": 0,
        "comments.user_id": 0,
        "comments.user.location": 0,
        "comments.user.description": 0,
        "comments.user.occupation": 0,
        "comments.user.__v": 0
      } }
  ], function (err, photos) {
    if (err) {
      // Query returned an error. We pass it back to the browser with an
      // Internal Service Error (500) error code.
      console.error("Error in /photosOfUser/:id", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    if (photos.length === 0) {
      // Query didn't return an error but didn't find the SchemaInfo object -
      // This is also an internal error return.
      response.status(400).send();
      return;
    }
    // We got the object - return it in JSON format.
    response.end(JSON.stringify(photos));
  });
});

const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log("Listening at http://localhost:" + port + " exporting the directory " + __dirname);
});