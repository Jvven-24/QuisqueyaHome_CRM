-- Bases separadas dentro del Postgres del stack qh-dev: datos del CRM, autenticación (GoTrue) y Moodle.
CREATE DATABASE crm;
CREATE DATABASE auth;
CREATE DATABASE moodle;
\connect auth
CREATE SCHEMA IF NOT EXISTS auth;
