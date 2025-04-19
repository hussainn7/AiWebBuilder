-- Create the database
CREATE DATABASE taskpulse;

-- Connect to the database
\c taskpulse;

-- Create the users table
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "profilePicture" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
); 