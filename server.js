var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/new/*', function (req, res) {
  //console.log(req.params['0']);
  var url = req.params['0'];
  if (isValid(url)) {
    res.json({a: "awesome"});
  } else {
    res
      .status(404)
      .json({error: "Your url is invalid. Make sure it looks something like this - http://www.example.com"});
  }
});

app.listen(8080);



function isValid(url) {
  // http://www.example.com
  var regex = /^https?:\/\/www\.\w+\.[a-zA-Z]+(\.[a-zA-Z]+)?\/?$/;
  return regex.test(url);
}
