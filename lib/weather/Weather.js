'use strict';

function Weather(forecast, time) {
  this.time = new Date(time * 1000).toDateString();
  this.forecast = forecast;
}

Weather.prototype.save = function () {
  let sql = 'INSERT INTO weather (time, forecast) VALUES ($1, $2);';
  let safeValues = [this.time, this.forecast];
  client.query(sql, safeValues);
};

module.exports = Weather;
