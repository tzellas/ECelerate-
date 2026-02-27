BEGIN;

--
-- Name: point_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE charger_status AS ENUM (
    'available',
    'charging',
    'reserved',
    'malfunction',
    'offline'
);

CREATE TYPE vehicle_types AS ENUM (
    'motorcycle',
    'car',
    'truck'
);

CREATE TYPE providers AS ENUM (
    'dei',
    'bombastic_electric',
    'big_energy'
);


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: -
--

-- maybe use id INTEGER GENERATED ALWAYS AS IDENTITY, check later

-- =========================
-- TABLES
-- =========================

CREATE TABLE driver (
    driver_id       SERIAL PRIMARY KEY,
    username        VARCHAR(255) NOT NULL, 
    password        VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    credit_points   INTEGER,
    balance         DECIMAL(15,2) DEFAULT 0.00
);

CREATE TABLE vehicle (
    license_plates  VARCHAR(15) PRIMARY KEY,
    vehicle_type    vehicle_types NOT NULL, 
    model           VARCHAR(255) NOT NULL,
    battery_size    INTEGER
);


CREATE TABLE charger (
    charger_id      SERIAL PRIMARY KEY,
    status          charger_status NOT NULL,
    cap             INTEGER NOT NULL,
    charger_number  INTEGER NOT NULL
);


CREATE TABLE station (
    station_id      SERIAL PRIMARY KEY,
    num_chargers    INTEGER NOT NULL,    
    lon             numeric(9,6) NOT NULL,
    lat             numeric(9,6) NOT NULL,
    provider        providers NOT NULL,
    price_per_kwh   numeric(9,2) NOT NULL,
    address_street  varchar(50) NOT NULL,
    address_number  INTEGER NOT NULL,
    postal_code     INTEGER NOT NULL,    
    area            varchar(50) NOT NULL
);

CREATE TABLE payment (
    payment_id      SERIAL PRIMARY KEY,
    price_paid      DECIMAL(9,2) NOT NULL, 
    paid_at         TIMESTAMP NOT NULL,
    points_used     INTEGER
);

CREATE TABLE charging (
    charge_id           SERIAL PRIMARY KEY,
    connection_time     TIMESTAMP NOT NULL,
    disconnection_time  TIMESTAMP NOT NULL,
    start_soc           INTEGER,
    end_soc             INTEGER,
    kwh_needed          DECIMAL(9,2),
    kwh_price           DECIMAL(9,2),
    price               DECIMAL(9,2), 

    CONSTRAINT chk_start_soc
        CHECK (start_soc BETWEEN 0 AND 100),

    CONSTRAINT chk_end_soc
        CHECK (end_soc BETWEEN 0 AND 100),

    CONSTRAINT chk_soc_order
        CHECK (end_soc >= start_soc)
);

CREATE TABLE charger_status_history (
    history_id     SERIAL PRIMARY KEY,
    charger_id     INTEGER NOT NULL,
    old_status     charger_status NOT NULL,
    new_status     charger_status NOT NULL,
    changed_at     TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_history_charger
        FOREIGN KEY (charger_id)
        REFERENCES charger(charger_id)
        ON DELETE CASCADE
);



-- =========================
-- RELATIONSHIPS (FOREIGN KEYS)
-- =========================

-- driver owns one or many vehicles (one-to-many)
ALTER TABLE vehicle
ADD COLUMN driver_id INTEGER NOT NULL;

ALTER TABLE vehicle
ADD CONSTRAINT fk_vehicle_driver
FOREIGN KEY (driver_id)
REFERENCES driver(driver_id)
ON DELETE CASCADE;

-- stations have many chargers (1:M)
ALTER TABLE charger
ADD COLUMN station_id INTEGER NOT NULL;

ALTER TABLE charger
ADD CONSTRAINT fk_charger_station
FOREIGN KEY (station_id)
REFERENCES station(station_id)
ON DELETE CASCADE;

-- a payment is being made by a driver (1:M)
-- a payment is being made for a specific charge (1:1)
ALTER TABLE payment
ADD COLUMN driver_id INTEGER NOT NULL,
ADD COLUMN charge_id INTEGER NOT NULL;

ALTER TABLE payment
ADD CONSTRAINT fk_payment_driver
FOREIGN KEY (driver_id)
REFERENCES driver(driver_id);

ALTER TABLE payment
ADD CONSTRAINT fk_payment_charging
FOREIGN KEY (charge_id)
REFERENCES charging(charge_id)
ON DELETE CASCADE;

ALTER TABLE payment
ADD CONSTRAINT uq_payment_charging UNIQUE (charge_id);

-- the driver is the one who decides if a charging begins/happens (1:M)
-- a car is what is getting charged (1:M)
-- the station is where the charging happens (1:M)
ALTER TABLE charging
ADD COLUMN driver_id INTEGER NOT NULL,
ADD COLUMN license_plates VARCHAR(15) NOT NULL,
ADD COLUMN station_id INTEGER NOT NULL;

ALTER TABLE charging
ADD CONSTRAINT fk_charging_driver
FOREIGN KEY (driver_id)
REFERENCES driver(driver_id);

ALTER TABLE charging
ADD CONSTRAINT fk_charging_vehicle
FOREIGN KEY (license_plates)
REFERENCES vehicle(license_plates);

ALTER TABLE charging
ADD CONSTRAINT fk_charging_station
FOREIGN KEY (station_id)
REFERENCES station(station_id)
ON DELETE CASCADE;

-- =========================
-- TABLES FOR MANY TO MANY RELATIONSHIPS 
-- =========================

-- a driver makes many reservation on many chargers
CREATE TABLE reserves_position (
    reservation_id          SERIAL PRIMARY KEY,
    reservation_price       DECIMAL(9,2) NOT NULL,
    reservation_start_time  TIMESTAMP NOT NULL,
    reservation_end_time    TIMESTAMP NOT NULL,

    driver_id               INTEGER NOT NULL,
    charger_id              INTEGER NOT NULL,

    CONSTRAINT fk_reservation_driver
        FOREIGN KEY (driver_id)
        REFERENCES driver(driver_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reservation_charger
        FOREIGN KEY (charger_id)
        REFERENCES charger(charger_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_reservation_time
        CHECK (reservation_end_time > reservation_start_time)
);

-- a driver gives many ratings to many stations 
-- one rating per station though
CREATE TABLE gives_rating (
    rating                  INTEGER NOT NULL CHECK (rating between 1 AND 5),

    driver_id               INTEGER NOT NULL,
    station_id              INTEGER NOT NULL,

    CONSTRAINT pk_rating
        PRIMARY KEY (driver_id, station_id),

    CONSTRAINT fk_rating_driver
        FOREIGN KEY (driver_id)
        REFERENCES driver(driver_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rated_station
        FOREIGN KEY (station_id)
        REFERENCES station(station_id)
        ON DELETE CASCADE
);


-- =========================
-- INDEXES
-- =========================

CREATE INDEX idx_vehicle_driver_id      ON vehicle(driver_id);
CREATE INDEX idx_charger_station_id     ON charger(station_id);
CREATE INDEX idx_payment_driver_id      ON payment(driver_id);
CREATE INDEX idx_payment_charging_id    ON payment(charge_id);
CREATE INDEX idx_charging_driver_id     ON charging(driver_id);
CREATE INDEX idx_charging_vehicle_lp    ON charging(license_plates);
CREATE INDEX idx_charging_station_id    ON charging(station_id);
CREATE INDEX idx_reservation_driver     ON reserves_position(driver_id);
CREATE INDEX idx_reservation_charger    ON reserves_position(charger_id);
CREATE INDEX idx_rating_station         ON gives_rating(station_id);



COMMIT;
