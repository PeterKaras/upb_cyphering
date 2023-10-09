CREATE TABLE IF NOT EXISTS user (
  id serial PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  text VARCHAR(255)
);

INSERT INTO user (firstName, lastName, text)
VALUES
  ('John', 'Doe', 'Hello, John!'),
  ('Jane', 'Smith', 'Hi, Jane!'),
  ('Alice', 'Johnson', 'Welcome, Alice!');