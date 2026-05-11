# ParkSmart - A Parking Reservation and  Monitoring Platform
A real-time parking reservation and monitoring system for efficient slot management.


## Project Overview
ParkSmart is an integrated parking reservation and monitoring platform designed to streamline parking management. It allows users to reserve slots based on vehicle type, tracks occupancy in real-time, and automates fee calculations and overstay penalties and provides a detailed revenue report page.

## 📄 Documentation
[* [Link to SRS Document] (https://docs.google.com/document/d/1eSJvgdz7jcOR-ZwH0FXLqt8RWonsTp68mtIqpj8OLCI/edit?usp=sharing)

## 👥 Team Members
* **Member Name 1: Tasmia hossain** (ID: 22201742) 
* **Member Name 2: Montasir Mahmud** (ID: 23301119)
* **Member Name 3: Kamrul Islam Kamran** (ID: 24341149)
* **Member Name 4: Md. Sajidur Rahman** (ID: 22101791)

## 💻 Tech Stack
* **Frontend:** HTML, CSS, JavaScript, and React.js  
  (HTML, CSS, and Vanilla JavaScript were used for the authentication pages, finance-admin dashboard, live parking activity table, and revenue report page. React.js was used for slot details, vehicle details, reservation extension, notification and recommended slot components.
* **Backend:** Node.js with Express.js
   (Used to create REST API routes for authentication, finance activity logs, parking slots, reservations, vehicles, and revenue reports.)
* **Database:** MongoDB Atlas with Mongoose  
  MongoDB Atlas was used as the cloud database, while Mongoose was used to define schemas and interact with the database. It stores users, finance/activity logs, vehicles, reservations, parking slots, and notification data.
* **External API:** ExchangeRate API using `axios`  
  (Used in the revenue report feature to convert total revenue from BDT to other currencies such as USD and EUR.)
**Authentication & Authorization:** bcrypt.js and JSON Web Token (JWT)  
   (bcrypt.js is used to hash user passwords, and JWT is used to generate login tokens and support role-based access.)

