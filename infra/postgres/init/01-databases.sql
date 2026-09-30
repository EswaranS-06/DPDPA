-- Extra databases: keycloak (identity) and duatf_test (integration tests).
CREATE DATABASE keycloak;
CREATE DATABASE duatf_test;
\connect duatf
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
