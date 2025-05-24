Storage Management System
A robust web application for managing digital assets, including folders, notes, images, and PDFs, with features like user authentication, item copying, sharing, and calendar-based organization. Built with Node.js, Express, MongoDB, and Multer for file uploads.

Table of Contents

Features
Tech Stack
Prerequisites
Installation
Environment Variables
Running the Project
API Endpoints
Authentication Routes
Item Routes

File Uploads
Testing with Postman
Limitations
Future Enhancements
Contributing
License

Features

User Authentication:
Register, login, logout.
Forgot password and reset password via email.
Change password and username.
Delete account (including associated items).

Item Management:
Create, read, update, delete (CRUD) items: folders, notes, images, PDFs.
Folders can contain other items (nested hierarchy via parentId).
Notes support text content.
Images and PDFs support file uploads (JPEG, PNG, PDF; 5MB limit).
Toggle favorite status for items.
Search items by name, type, or creation date.

Copy/Duplicate:
Copy items (including folders and their children).
Duplicates files for images/PDFs and preserves folder hierarchies.

Sharing:
Share items with other users by user ID.
Shared users can view, update, and favorite items (but not delete or share).

Calendar View:
Group items by creation date (day, week, month).

Security:
JWT-based authentication for protected routes.
File type and size validation for uploads.
Private items with optional PIN (hashing via bcrypt).
Owner-only permissions for deletion and sharing.

Tech Stack

Backend: Node.js, Express.js
Database: MongoDB (MongoDB Atlas)
Authentication: JSON Web Tokens (JWT), bcrypt for password hashing
File Uploads: Multer (local storage in uploads/ directory)
Email: Nodemailer for password reset emails
Environment: dotenv for configuration
Development: Nodemon for hot reloading
Dependencies: See package.json

Prerequisites

Node.js: v20.x or higher (tested with v21.1.0)
MongoDB Atlas: Free-tier cluster or local MongoDB instance
Email Service: Gmail or other SMTP service for password reset emails
Postman: For API testing

Installation

Clone the Repository:
git clone <repository-url>
cd storage-management-system

Install Dependencies:
npm install

Create uploads/ Directory:
mkdir uploads

Environment Variables
Create a .env file in the project root and add the following:
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/storage?retryWrites=true&w=majority
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<your_email@gmail.com>
EMAIL_PASS=<your_app_specific_password>

MONGO_URI: Your MongoDB Atlas connection string.
JWT_SECRET: A secure string for JWT signing (e.g., generate with crypto.randomBytes(32).toString('hex')).
EMAIL_USER: Email address for sending password reset emails.
EMAIL_PASS: App-specific password (for Gmail, generate via Google Account settings).

Running the Project

Start the Server:
npm run dev

Uses Nodemon for hot reloading.
Server runs on http://localhost:5000 (or your PORT).

Verify Connection:

Console should log: Server running on port 5000 and MongoDB connected.
