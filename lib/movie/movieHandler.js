'use strict';

const Movie = require('./Movie');
const superagent = require('superagent');

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

module.exports = movieHandler;
