'use strict';

const express = require('express');

const cors = require('cors');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());

const superagent = require('superagent');

app.get('/', (request, response) => {
  response.send('Hello Sams World');
});

app.get('/location', locHandler);
app.get('/weather', weatherHandler);



function locHandler(req, res) {
  let city = req.query.city;
  let key = process.env.Location_API_Key;
  const URL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

  superagent.get(URL)
    .then(data => {
      let location = new Location(city, data.body[0]);
      res.status(200).json(location);
    });
}

function weatherHandler(req, res) {
  let city = req.query.search_query;
  // console.log(req.query);
  let key = process.env.Weather_API_Key;
  let weatherArr = [];
  const URL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}&days=7`;

  superagent.get(URL)
    .then(data => {
      // console.log(data.body);
      data.body.data.forEach(value => {
        let weather = new Weather(value);
        weatherArr.push(weather);

      });
      console.log(weatherArr);
      res.status(200).json(weatherArr);


    });
}

// app.get('/location', (request, response) => {
//   let city = request.query.city;
//   let data = require('./data/location.json')[0];
//   let location = new Location(data, city);
//   response.send(location);

// });

// app.get('/weather', (request, response) => {
//   let data = require('./data/weather.json');
//   let weatherArr = [];
//   data.data.forEach(value => {
//     let weather = new Weather(value);
//     weatherArr.push(weather);
//   });
//   response.send(weatherArr);
//   console.log(weatherArr);
// });

// app.get('*', (reg, res) => {
//   res.status(500).send('Error');
// });



function Location(city, locationData) {
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
  this.search_query = city;
  this.formatted_query = locationData.display_name;
}

function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = obj.datetime;
}

app.listen(PORT, () => {
  console.log(`running on ${PORT}`);
});
