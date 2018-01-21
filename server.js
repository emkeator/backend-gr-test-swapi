const express = require('express'),
      ejs = require('ejs'),
      cors = require('cors'),
      bodyParser = require('body-parser'),
      axios = require('axios'),
      app = express(),
      port = 3005

app.use(bodyParser.json())
app.use(cors())


app.set('view engine', 'ejs')

//Basic Endpoint
app.get('/', function(req, res) {
    res.render('index.ejs');
});


app.listen(port, () => console.log(`I'm listening on port ` + port))