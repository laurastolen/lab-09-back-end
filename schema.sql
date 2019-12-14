DROP TABLE IF EXISTS location, weather CASCADE;

CREATE TABLE IF NOT EXISTS location(
  id SERIAL PRIMARY KEY,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  city VARCHAR(255),
  formatted_query VARCHAR(255)
);


CREATE TABLE IF NOT EXISTS weather(
  id SERIAL PRIMARY KEY,
  forecast VARCHAR(255),
  time VARCHAR(255)
);
