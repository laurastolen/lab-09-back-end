'use strict';

const express = require('express');
require('dotenv').config();
const cors = require('cors');

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch((err) => console.error(err));

// ----------------ROUTES-------------------

app.get('/location', locationHandler);

// EXPECTED BY THE FRONT END FOR LOCATION:
// {
//   "search_query": "seattle",
//   "formatted_query": "Seattle, WA, USA",
//   "latitude": "47.606210",
//   "longitude": "-122.332071"
// }

function Location(city, geoData) {
  // eslint-disable-next-line camelcase
  this.search_query = city;
  // eslint-disable-next-line camelcase
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

function locationHandler(request, response) {
  let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;

  let sql = 'SELECT * FROM location WHERE city=$1;';
  let city = request.query.data;

  let safeValues = [city];

  client.query(sql, safeValues)
    .then(results => {
      if (results.rows.length > 0) {
        return response.send(results.rows[0]);
      } else {

        superagent.get(url)
          .then(data => {
            const geoData = data.body;
            let latitude = geoData.results[0].geometry.location.lat;
            let longitude = geoData.results[0].geometry.location.lng;

            const locationObj = new Location(city, geoData);
            let sql = 'INSERT INTO location (city, latitude, longitude) VALUES ($1, $2, $3);';
            let safeValues = [city, latitude, longitude];

            client.query(sql, safeValues);
            response.send(locationObj);
          })
          .catch((error) => {
            response.status(500).send(error);
          });
      }
    })
    .catch((err) => console.error(err));
}

// define weather route--------------------------------
app.get('/weather', weatherHandler);

function Weather(forecast, time) {
  this.time = new Date(time * 1000).toDateString();
  this.forecast = forecast;
}

Weather.prototype.save = function () {
  let sql = 'INSERT INTO weather (time, forecast) VALUES ($1, $2);';
  let safeValues = [this.time, this.forecast];
  client.query(sql, safeValues);
};

function weatherHandler(request, response) {

  let url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(data => {
      const weatherData = data.body.daily.data.map(value => {
        let weatherSummary = new Weather(value.summary, value.time);
        weatherSummary.save();

        return weatherSummary;
      });
      response.send(weatherData);
    })
    .catch((error) => {
      response.status(500).send(error);
    });
}

// page not found route
app.get('*', (request, response) => {
  response.status(404);
});
