-- The following is used to create the database and tables in PostgreSQL

CREATE DATABASE lego401;

CREATE TABLE IF NOT EXISTS lego_sets(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price FLOAT(8),
    series VARCHAR(255),
    pieces INT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS minifigs(
    minifig_id SERIAL PRIMARY KEY,
    lego_id INT REFERENCES lego_sets(id),
    name VARCHAR(50)
);

-- INSERT INTO lego_sets(name, price, series) VALUES ('The Tumbler', 119.99, 'The Dark Knigth')
-- INSERT INTO lego_sets(name, price, series) VALUES ('The Boys', 200.99, 'The Boys Lego Series')
