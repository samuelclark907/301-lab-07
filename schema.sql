DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  latitude NUMERIC(20,14),
  longitude NUMERIC(20,14),
  search_query VARCHAR(255),
  formatted_query VARCHAR(255)
);

