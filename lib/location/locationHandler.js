/* eslint-disable camelcase */
'use strict';

const client = require('../../lib/client');
const superagent = require('superagent');
const Location = require('./Location');


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
            let formatted_address = geoData.results[0].formatted_address;

            const locationObj = new Location(city, geoData);
            let sql = 'INSERT INTO location (city, latitude, longitude, formatted_query) VALUES ($1, $2, $3, $4);';
            let safeValues = [city, latitude, longitude, formatted_address];

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

module.exports = locationHandler;
