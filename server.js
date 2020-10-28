'use strict';

const express = require('express');

const cors = require('cors');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());

const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);

const superagent = require('superagent');
const { json } = require('express');

app.get('/', (request, response) => {
  response.send('Hello Sams World');
});

//connect to database

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Now listening on port ${PORT}`);
    });
  });
//   .catch(err => {
//   console.log('ERROR', err)
// });

//routes

app.get('/location', locHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
app.get('/movies', moviesHandler);
app.get('/yelp', resHandler);

// app.get('/add', (req, res) => {
//   const latitude = req.query.latitude;
//   const longitude = req.query.longitude;
//   const search_query = req.query.search_query;
//   const formatted_query = req.query.formatted_query;

//   const SQL = 'INSERT INTO locations (latitude, longitude, search_query, formatted_query) VALUES ($1, $2, $3, $4)';

//   const safeValues = [latitude, longitude, search_query, formatted_query];

//   client.query(SQL, safeValues)
//     .then(results => {
//       console.log(results);
//     });
// .catch( error => {
//   console.log('Error', error)
//   res.status(500).send('Shits Broke')
// })
// });

//function handlers

function locHandler(req, res) {
  let city = req.query.city;
  let key = process.env.Location_API_Key;
  const sqlCheck = 'SELECT * FROM locations WHERE search_query=$1';
  const sqlVals = [city];
  client.query(sqlCheck, sqlVals)
    .then(results => {
      // console.log('HELLLO', results.rows);
      if (results.rows.length) res.status(200).json(results.rows[0]);
      else {
        const URL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;




        superagent.get(URL)
          .then(data => {
            let location = new Local(city, data.body[0]);
            const latitude = location.latitude;
            const longitude = location.longitude;
            const search_query = location.search_query;
            const formatted_query = location.formatted_query;
            const SQL = 'INSERT INTO locations (latitude, longitude, search_query, formatted_query) VALUES ($1, $2, $3, $4)';
            const safeValues = [latitude, longitude, search_query, formatted_query];
            client.query(SQL, safeValues)
              .then(results => {
                console.log(results.rows);
                res.status(200).json(location);
              });
          });
      }
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
      // console.log(weatherArr);
      res.status(200).json(weatherArr);
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).send('Server Error Weather');
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
      // console.log(data.body);
      let path = data.body.trails.map(trail => {
        let newDateTime = trail.conditionDate.split(' ');
        return new Trails(trail, newDateTime);
      });
      res.status(200).json(path);
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).send('Server Error Trail');
    });
}
// const testArr = [];
function moviesHandler(req, res) {
  let city = req.query.search_query;
  let key = process.env.Movies_API_Key;
  const URL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&language=en-US&query=${city}&page=1&include_adult=false`;

  superagent.get(URL)
    .then(data => {
      // console.log(data);
      let movie = data.body.results.map(movies => {
        // console.log(movie);
        console.log(movies);
        // testArr.push(movies);
        return new Movies(movies);
      });
      // console.log(testArr);
      res.status(200).json(movie);
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).send('Server Error Movie');
    });
}


function resHandler(req,res) {
  let city = req.query.search_query;
  let key = process.env.Yelp_API_Key;

  const URL = `https://api.yelp.com/v3/businesses/search?location=${city}&term=restaurants&limit=5&offset=5`;
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



function Local(city, locationData) {
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

function Movies(obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = 'https://image.tmdb.org/t/p/w500' + obj.poster_path;
  this.popularity = obj.popularity;
  this.released_on = obj.released_date;
}

function Restaurant(obj) {
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}

// app.listen(PORT, () => {
//   console.log(`running on ${PORT}`);
// });
