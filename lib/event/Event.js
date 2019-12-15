'use strict';

function Event(obj) {
  this.link = obj.url;
  this.name = obj.title;
  // eslint-disable-next-line camelcase
  this.event_date = obj.start_time;
  this.summary = obj.description;
}

module.exports = Event;
