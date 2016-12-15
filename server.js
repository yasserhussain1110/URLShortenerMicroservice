var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();

var dbUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/yasser";

app.use(express.static('public'));

app.get('/:id(\\d+)', function (req, res) {
  var id = req.params.id;

  var onSuccess = function (original_url) {
    res.redirect(original_url);
  };

  var onFailure = function () {
    res.json({error: id + " not found dude"});
  };

  findUrl(id, onSuccess, onFailure);
});

app.get('/new/*', function (req, res) {
  var url = req.params['0'];
  if (isValid(url)) {
    var onSuccess = function(url_id) {
      constructUrlFromId(req, url_id);
      res.json({original_url: url, short_url: constructUrlFromId(req, url_id)});
    };

    var onFailure = function(message) {
      res.json({error: message});
    };

    insertUrl(url, onSuccess, onFailure);

  } else {
    res
      .status(404)
      .json({error: "Your url is invalid. Make sure it looks something like this - http://www.example.com"});
  }
});

function constructUrlFromId(req, url_id) {

  var proto = req.headers['x-forwarded-proto'] ||
                req.connection.encrypted ? "https" : "http";

  return proto + "://" + req.headers.host + "/" + url_id;
}

app.listen(process.env.PORT || 8080);

//db.shortened_url.createIndex({url_id: 1}, {unique: true})
//db.shortened_url.createIndex({original_url: 1}, {unique: true})


function insertUrl(url, successCallback, failureCallback) {
  mongo.connect(dbUrl, function (err, db) {
    const shortenedURL = db.collection("shortened_url");
    shortenedURL.find({}, {url_id: 1}).sort({url_id: -1}).limit(1).toArray(function (err, docs) {
      if (docs.length == 0) {
        var id = 1;
      } else {
        var id = docs[0].url_id + 1;
      }

      shortenedURL.insert({original_url: url, url_id: id}, function (err, data) {
        if (err) {
          failureCallback(err.message);
        } else {
          var url_id = data.ops[0].url_id;
          successCallback(url_id);
        }
        db.close();
      });
    });
  });
}

function findUrl(url_id, successCallback, failureCallback) {
  mongo.connect(dbUrl, function (err, db) {
    const shortenedURL = db.collection("shortened_url");
    shortenedURL.find({
      url_id: {
        $eq: +url_id
      }
    }).toArray(function (err, docs) {
      if (docs.length == 0) {
        failureCallback();
      } else {
        var original_url = docs[0].original_url;
        successCallback(original_url);
      }
    });
  });
}


function isValid(url) {
  // http://www.example.com
  var regex = /^https?:\/\/www\.\w+\.[a-zA-Z]+(\.[a-zA-Z]+)?\/?$/;
  return regex.test(url);
}
