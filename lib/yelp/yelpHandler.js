'use strict';

const superagent = require('superagent');
const Yelp = require('./Yelp');

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

module.exports = yelpHandler;
