CREATE TABLE IF NOT EXISTS provinces (
  id varchar PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS regencies (
  id varchar PRIMARY KEY,
  province_id varchar REFERENCES provinces(id) ON DELETE CASCADE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
  id varchar PRIMARY KEY,
  regency_id varchar REFERENCES regencies(id) ON DELETE CASCADE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS villages (
  id varchar PRIMARY KEY,
  district_id varchar REFERENCES districts(id) ON DELETE CASCADE,
  name text NOT NULL
);
