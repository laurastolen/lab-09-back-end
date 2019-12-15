'use strict';

const superagent = require('superagent');
const Event = require('./Event');

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

module.exports = eventHandler;
