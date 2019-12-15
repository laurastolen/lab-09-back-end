'use strict';

const superagent = require('superagent');
const Weather = require('./Weather');

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

module.exports = weatherHandler;
