# ECcelerate

**ECcelerate** is a project from Liagkas Nikolaos (el19221) and Tzellas Apostolos (el19878) for the ECE NTUA course Software Engineering. The full git history is not available because this project was developed through academic private github accounts.

Our goal was to develop a full-stack website that focuses on **Electrical Vehicle Charging**. It provides comprehensive services for the management of electric vehicle charging. Its main goal is to facilitate vehicle owners in locating nearby and available charging stations through an interactive map, comparing prices and technical characteristics, reserving and activating chargers for a specific time period, and monitoring the charging process and its cost in real time.

In addition, the system collects essential statistical data related to user activity, charging sessions, energy consumption, and expenses. These statistics are presented to vehicle owners, through personalized user profiles and graphical visualizations.

The platform is implemented using a RESTful architecture, ensuring secure communication between the frontend and backend, real-time data retrieval from the database, and extensibility for future features such as advanced analytics, reporting, and support for multiple user roles.


# Technologies Used
* nodejs
* express ejs
* Python
* CSS
* HTML
* PostgreSQL

# Setup
**1.** Clone our GitHub repository using the command:
```bash
   git clone https://github.com/ntua/softeng25-25 
```
**2.** The database can be set up by running the code in [mySchema.sql](https://github.com/ntua/softeng25-25/blob/main/back-end/data/mySchema.sql) and importing the already generated data from the CSVs in the [data folder](https://github.com/ntua/softeng25-25/tree/main/back-end/data). Optionally, if you want to generate your own data, you can use [myDataGenerator.py](https://github.com/ntua/softeng25-25/blob/main/back-end/data/myDataGenerator.py), which contains instructions at the end of the file.

**3.** You need to modify the file [db.js](https://github.com/ntua/softeng25-25/blob/main/back-end/src/config/db.js) with your own database credentials.

**4.** Install Dependencies inside both ``` back-end ``` and ``` front-end ``` directories by running the following command
```bash
   npm install
```
**5.** To start the app you need to run the following command in both the ``` back-end ``` and ``` front-end ``` directories
```bash
   npm start
```



