import csv
import random
import string
from datetime import datetime, timedelta


def generate_drivers():
    first_names = [
        "Nikos", "Apostolos", "Alexandros", "Giannis",
        "Markos", "Alexandra", "Katerina", "Orestis",
        "Dimitris", "Giorgos", "Konstantinos", "Panagiotis", 
        "Christos", "Andreas", "Stefanos", "Manolis",
        "Spyros", "Vasilis", "Thodoris", "Vaggelis", 
        "Petros", "Achilleas", "Iasonas", "Agamemnonas"
            
    ]

    last_names = [
        "Liagkas", "Tzellas", "Mixos", "Komnas",
        "Bourdakos", "Kappa", "Liagka", "Mper",
        "Papadopoulos", "Nikolaidis", "Georgiou", "Dimitriou", 
        "Konstantinou", "Christodoulou", "Ioannidis", "Papanikolaou",
        "Anastasiou", "Karagiannis", "Vlahos", "Stavropoulos", 
        "Mantalos", "Raptis", "Makris", "Zografos"
    ]

    drivers=[]

    for i in range(24):
        first = first_names[i]
        last = last_names[i]
        random_num = random.randint(1000, 9999)
        password = f"password{random_num}"
        username = f"{first.lower()}_{last.lower()}{random_num}"
        email = f"{username}@mail.com"
        credit_points = random.randint(0, 500)
        balance = round(random.uniform(0, 200), 2)
        
        drivers.append([
            username,
            password,
            email,
            first,
            last,
            credit_points,
            balance
        ])
        
    with open("drivers.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "username",
            "password",
            "email",
            "first_name",
            "last_name",
            "credit_points",
            "balance"
        ])
        writer.writerows(drivers)

    print("drivers.csv generated with 24 drivers")
    

def generate_stations():

    providers = ["dei", "bombastic_electric", "big_energy"]

    streets = [
        "Panepistimiou",
        "Stadiou",
        "Patission",
        "Kifisias",
        "Syngrou",
        "Vouliagmenis",
        "Tsimiski",
        "Egnatia",
        "Venizelou",
        "Leoforos Athinon",
        "Leoforos Panagi Tsaldari",
        "Anapafseos",
        "Ioanni Foka"
    ]

    areas = [
        "Athens",
        "Piraeus",
        "Marousi",
        "Kallithea",
        "Nea Smyrni",
        "Chalandri",
        "Glyfada",
        "Peristeri",
        "Filadelfeia",
        "Ilion",
        "Mosxato",
        "Ano Patisia"
    ]

    stations = []

    for i in range(15):
        # each station will have max 10 chargers
        num_chargers = random.randint(2, 10)
        
        # Athens approximate coordinates 
        lon = round(random.uniform(23.60, 23.80), 6)
        lat = round(random.uniform(37.90, 38.10), 6)
        
        # Respecting db enum for providers 
        provider = random.choice(providers)
        price_per_kwh = round(random.uniform(0.20, 0.60), 2)
        
        
        for i in range(15):
            if i < len(streets): 
                address_street = streets[i]
            else: address_street = random.choice(streets)        
        
        address_number = random.randint(1, 199)
        
        # 10xxx-19xxx is the range of postal codes in the Attiki aree
        postal_code = random.randint(11111, 19999)
        
        for i in range(15):
            if i < len(areas): 
                area = areas[i]
            else: area = random.choice(areas)
        
        stations.append([
                num_chargers,
                lon,
                lat,
                provider,
                price_per_kwh,
                address_street,
                address_number,
                postal_code,
                area
            ])
        

    with open("stations.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "num_chargers",
            "lon",
            "lat",
            "provider",
            "price_per_kwh",
            "address_street",
            "address_number",
            "postal_code",
            "area"
        ])
        writer.writerows(stations)
        

def generate_chargers():
    chargers = []
    
    charger_status = [
        "available",
        "charging",
        "reserved",
        "malfunction",
        "offline"
    ]

    charger_caps = [75, 100, 150]

    with open("stations_for_chargers.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            station_id = int(row["station_id"])
            num_chargers = int(row["num_chargers"])
            
            # I want my charger caps to be consecutive. This below ensures that,
            # e.g. 6 chargers --> caps : 75, 75, 100, 100, 150, 150
            #      7 chargers --> caps : 75, 75, 75, 100, 100, 150, 150
            result = []
            base = num_chargers // len(charger_caps)
            remainder = num_chargers % len(charger_caps)

            for i, cap in enumerate(charger_caps):
                count = base + (1 if i < remainder else 0)
                result.extend([cap] * count)
                            
            for charger_number, cap in enumerate(result, start=1):
                status = random.choices(
                    charger_status,
                    weights=[50, 20, 10, 10, 10],  # realistic distribution
                    k=1
                )[0]
                
                chargers.append([
                        status,
                        cap,
                        charger_number,
                        station_id
                    ])
            
    with open("chargers.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "status",
            "cap",
            "charger_number",
            "station_id"
        ])
        writer.writerows(chargers)

    print(f"chargers.csv generated with {len(chargers)} chargers")
                


def generate_vehicles():
    # I have generated 24 drivers exactly
    num_drivers = 24

    vehicle_types = ["motorcycle", "car", "truck"]
    vehicle_models = {
        "motorcycle": ("Honda", "Kawasaki"),
        "car": ("Tesla", "Nissan", "Ford", "Hyundai"),
        "truck": ("BMW", "Mercedes")
    }

    # Initially i will create 24 VEHICLES, one for each driver
    # Later a driver will have the ability to have more than one vehicle

    vehicles = []
    license_plates = []
            
    for j in range(1, num_drivers+1):
        # Generation of 24 license plates
        while True:
            plate = (
                random.choice(string.ascii_uppercase)+
                random.choice(string.ascii_uppercase)+
                random.choice(string.ascii_uppercase)+
                "-"+
                str(random.randint(1000, 9999))
            )
            if plate not in license_plates:
                license_plates.append(plate)
                break; 
        
            
        type = random.choice(vehicle_types)
        model = random.choice(vehicle_models[type])
        
        if type == "motorcycle": battery_size = 15
        elif type == "car"     : battery_size = 40
        elif type == "truck"   : battery_size = 120 
        driver_id = j
        
        vehicles.append([
            plate,
            type,
            model,
            battery_size,
            driver_id
        ])
        
    with open("vehicles.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "license_plates",
            "vehicle_type",
            "model",
            "battery_size",
            "driver_id"
        ])
        writer.writerows(vehicles)

    print(f"vehicles.csv generated with {len(vehicles)} vehicles")


def generate_charging():
    # LOAD DATA
    # charging has 3 foreign keys, first we have to load the data from the 3 csvs
    drivers = []
    vehicles = {}
    stations = []
    
    # I dont have the driver_id in drivers
    # but I have 24 drivers and the id is 1-24
    # so it is ok to do it like that
    with open("drivers.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1): 
            drivers.append(i) 

    with open("vehicles.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            vehicles[row["driver_id"]] = {
                "license_plates": row["license_plates"],
                "battery_size": int(row["battery_size"])
            }
    with open("stations.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            stations.append({
                "station_id": i,
                "price_per_kwh": float(row["price_per_kwh"])
            })
            
    # GENERATE CHARGING
    charging = []
    base_date = datetime(2025, 1, 1)
    
    for driver_id in drivers:
        license_plate = vehicles[str(driver_id)]["license_plates"]
        num_charges = random.randint(1,4)
        
        for i in range(num_charges):
            station = random.choice(stations)
            station_id = station["station_id"]
            kwh_price = station["price_per_kwh"]
            
            start_soc = random.randint(10, 60)
            # If it goes over 100% it will just pick 100
            end_soc = min(start_soc + random.randint(10,80), 100)
            soc_charged = end_soc - start_soc
            
            # We take the battery size form each vehicle 
            # and calculate the kwh needed 
            battery_size = vehicles[str(driver_id)]["battery_size"]
            kwh_needed = round((soc_charged/100)*battery_size, 2)
            price = round(kwh_needed * kwh_price, 2)
            
            connection_time = base_date + timedelta(
                days = random.randint(0,180),
                hours = random.randint(0,23),
                minutes = random.randint(0,59)
            ) 
            
            duration_minutes = random.randint(30,180)
            disconnection_time = connection_time + timedelta(minutes=duration_minutes)
            
            charging.append([
                connection_time.strftime("%Y-%m-%d %H:%M:%S"),
                disconnection_time.strftime("%Y-%m-%d %H:%M:%S"),
                start_soc,
                end_soc,
                kwh_needed,
                kwh_price,
                price,
                driver_id,
                license_plate,
                station_id
            ])
            
    with open("charging.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "connection_time",
            "disconnection_time",
            "start_soc",
            "end_soc",
            "kwh_needed",
            "kwh_price",
            "price",
            "driver_id",
            "license_plates",
            "station_id"
        ])
        writer.writerows(charging)

    print(f"charging.csv generated with {len(charging)} charging sessions")
        
            
def generate_payments():
    payments = []
    
    with open("charging.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        
        for charge_id, row in enumerate(reader, start=1):
            original_price = round(float(row["price"]), 2)
            price_paid = original_price
            driver_id = int(row["driver_id"])
            
            # In 70% of payments points were not used
            # In the other 30% because every credit_point used
            # equals to 1euro it is subtracted from the price_paid
            if random.random()<0.7 :
                points_used=0
            else:
                max_points = int(original_price)
                if max_points>0:
                    points_used = random.randint(1, max_points)
                    price_paid = round(original_price - points_used, 2)
                else: points_used = 0
            
            # The payment will happen almost automatically after the charging is finished
            disconnection_time = datetime.strptime(
                row["disconnection_time"],
                "%Y-%m-%d %H:%M:%S"
            )

            paid_at = disconnection_time + timedelta(minutes=random.randint(1, 5))
            
            payments.append([
                price_paid,
                paid_at.strftime("%Y-%m-%d %H:%M:%S"),
                points_used,
                driver_id,
                charge_id
            ])

    with open("payments.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "price_paid",
            "paid_at",
            "points_used",
            "driver_id",
            "charge_id"
        ])
        writer.writerows(payments)

    print(f"payment.csv generated with {len(payments)} payments")
    
    
def generate_reservations():
    reservations = []
    drivers = []
    chargers = []
    
    with open("drivers.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1): 
            drivers.append(i)
            
    with open("chargers.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1): 
            chargers.append(i)
            
    # same logic as generate_chargings basically
    base_date = datetime(2025, 1, 1)

    for driver_id in drivers:
        num_reservations = random.randint(0,3)
        
        for i in range(num_reservations):
            charger_id = random.choice(chargers)
                 
            reservation_start = base_date + timedelta(
                days = random.randint(0,180),
                hours = random.randint(0,23),
                minutes = random.randint(0,59)
            ) 
            
            duration_minutes = random.randint(15,120)
            reservation_end = reservation_start + timedelta(minutes = duration_minutes)
            
            # Every minute costs 10 cents
            # Every 10 mins --> 1 euro
            # Every Hour -----> 6 euros
            reservation_price = round(duration_minutes*0.1, 2)
            
            reservations.append([
                reservation_price,
                reservation_start.strftime("%Y-%m-%d %H:%M:%S"),
                reservation_end.strftime("%Y-%m-%d %H:%M:%S"),
                driver_id,
                charger_id
            ])
    
    with open("reserves_position.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "reservation_price",
            "reservation_start_time",
            "reservation_end_time",
            "driver_id",
            "charger_id"
        ])
        writer.writerows(reservations)

    print(f"reserves_position.csv generated with {len(reservations)} reservations")


def generate_ratings():
    ratings = []
    drivers = []
    stations = []
    used_stations = {}
    
    rating_values = [1, 2, 3, 4, 5]
    rating_weights = [1, 4, 10, 35, 50]
    
    with open("drivers.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1): 
            drivers.append(i)
            
    with open("stations.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1): 
            stations.append(i)
            
    with open("charging.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            driver_id = int(row["driver_id"])
            station_id = int(row["station_id"])
            used_stations.setdefault(driver_id, set()).add(station_id)

    for driver_id, stations in used_stations.items():
        num_ratings = random.randint(0, len(stations))
        rated_stations = random.sample(list(stations), num_ratings)

        for station_id in rated_stations:
            rating = random.choices(
                rating_values,
                weights=rating_weights,
                k=1
            )[0]

            ratings.append([rating, driver_id, station_id])
            
    with open("gives_rating.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "rating",
            "driver_id",
            "station_id"
        ])
        writer.writerows(ratings)

    print(f"gives_rating.csv generated with {len(ratings)} ratings")                       
            
def generate_charger_status_history():
    history = []

    allowed_transitions = {
        "available": ["charging", "reserved", "malfunction", "offline"],
        "reserved": ["charging", "malfunction", "offline"],
        "charging": ["available", "malfunction", "offline"],
        "malfunction": ["available"],
        "offline": ["available"]
    }

    chargers = []

    with open("chargers.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            chargers.append({
                "charger_id": i,
                "current_status": row["status"]
            })

    base_date = datetime(2025, 1, 1)

    for charger in chargers:
        charger_id = charger["charger_id"]
        current_status = charger["current_status"]

        num_changes = random.randint(1, 8)

        last_time = base_date + timedelta(
            days=random.randint(0, 180),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        for _ in range(num_changes):
            possible_next = allowed_transitions[current_status]
            new_status = random.choice(possible_next)

            history.append([
                charger_id,
                current_status,
                new_status,
                last_time.strftime("%Y-%m-%d %H:%M:%S")
            ])

            current_status = new_status
            last_time += timedelta(minutes=random.randint(10, 300))

    with open("charger_status_history.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "charger_id",
            "old_status",
            "new_status",
            "changed_at"
        ])
        writer.writerows(history)

    print(f"charger_status_history.csv generated with {len(history)} records")

    

################################################    
#generate_drivers()
#generate_stations()

################################################################################################
# After generating stations to generate the chargers, we need have to the station_id for each charger
# To do that you must run this command in your bash terminal 
# " psql -U postgres -d SoftengDB " 
# (postgres is my name, SoftengDB is my DB name, fill whatever names you have)
# put your password
# then run this command : 
# " \copy (SELECT station_id, num_chargers FROM station) TO 'stations_for_chargers.csv' CSV HEADER " 
# and you will have how many chargers each station has in stations_for_chargers.csv
################################################################################################

#generate_chargers()
#generate_vehicles()
#generate_charging()
#generate_payments()
#generate_reservations()
#generate_ratings()
#generate_charger_status_history()