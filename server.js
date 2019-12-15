/* eslint-disable camelcase */
'use strict';

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());

const client = require('./lib/client');

const locationHandler = require('./lib/location/locationHandler');
const weatherHandler = require('./lib/weather/weatherHandler');
const eventHandler = require('./lib/event/eventHandler');
const movieHandler = require('./lib/movie/movieHandler');
const yelpHandler = require('./lib/yelp/yelpHandler');

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch((err) => console.error(err));

// -----------routes----------
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/events', eventHandler);
app.get('/movies', movieHandler);
app.get('/yelp', yelpHandler);
app.get('*', (request, response) => {
  response.status(404);
});
