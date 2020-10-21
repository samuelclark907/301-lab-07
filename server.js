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
app.get('/trails', trailHandler);



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

function trailHandler(req, res) {
  // let city = req.query.location;
  let key = process.env.Trail_API_Key;
  let lon = req.query.longitude;
  let lat = req.query.latitude;
  const URL = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${key}`;


  superagent.get(URL)
    .then(data => {
      let path = data.body.trails.map(trail => {
        let newDateTime = trail.conditionDate.split(' ');
        return new Trails(trail, newDateTime);
      });
      res.status(200).json(path);
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

function Trails(obj, newDateTime) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionStatus;
  this.condition_date = newDateTime[0];
  this.condition_time = newDateTime[1];
}

app.listen(PORT, () => {
  console.log(`running on ${PORT}`);
});
