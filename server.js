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
            console.log(geoData);

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
      let weatherData = data.body.daily.data.map(value => {
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

// events route --------------
app.get('/events', eventHandler);

function Event(obj) {
  this.link = obj.url;
  this.name = obj.title;
  // eslint-disable-next-line camelcase
  this.event_date = obj.start_time;
  this.summary = obj.description;
}

function eventHandler(request, response) {
  let url = `http://api.eventful.com/json/events/search?location=${request.query.data.city}&app_key=${process.env.EVENTFUL_API_KEY}`;

  superagent.get(url)
    .then(results => {
      let rawEventsArr = JSON.parse(results.text).events.event;
      const finalEventsArr = rawEventsArr.map(value => new Event(value));
      response.send(finalEventsArr);
    })
    .catch(error => console.error(error));
}

// movies route --------------
app.get('/movies', movieHandler);

function Movie(obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  // eslint-disable-next-line camelcase
  this.average_votes = obj.vote_average;
  // eslint-disable-next-line camelcase
  this.total_votes = obj.vote_count;
  // eslint-disable-next-line camelcase
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popularity;
  // eslint-disable-next-line camelcase
  this.released_on = obj.release_date;
}

function movieHandler(request, response) {
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${request.query.data.city}`;

  superagent.get(url)
    .then(results => {
      let rawArray = results.body.results;
      let finalMovieArray = rawArray.slice(0, 20).map(movie => {
        let newMovie = new Movie(movie);
        return newMovie;
      });

      response.send(finalMovieArray);
    })
    .catch(error => console.error(error));
}

// yelp route--------------------
app.get('/yelp', yelpHandler);

function Yelp(obj) {
  this.name = obj.name;
  // eslint-disable-next-line camelcase
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}

function yelpHandler(request, response) {


  let url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;
  superagent.get(`${url}`).set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(yelpResults => {
      let rawYelpArr = yelpResults.body.businesses;
      let finalYelpArr = rawYelpArr.slice(0, 20).map(value => new Yelp(value));
      response.send(finalYelpArr);
    })
    .catch(error => console.error(error));
}

// page not found route----------------------
app.get('*', (request, response) => {
  response.status(404);
});
