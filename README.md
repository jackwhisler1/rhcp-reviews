# Music Review App

A web application for users to post and view reviews for different songs. The application is built using a Node.js backend with MySQL, and a React frontend developed with TypeScript and styled using Tailwind CSS.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Folder Structure](#folder-structure)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication and authorization
- Ability to post and view reviews for songs
- Restriction on who can post reviews based on user role
- Responsive design using Tailwind CSS

## Architecture

The application is divided into two main components:

1. **Backend (Node.js)**: Handles API requests, user authentication, and database interactions.
2. **Frontend (React & TypeScript)**: Provides user interface and handles presentation logic.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v14 or later)
- npm (Node Package Manager)
- MySQL (for the database)

### Installation

1. Clone the repository



2. Set up the backend:

   ```bash
   cd backend
   npm install
   ```

   - Create a `.env` file in the `backend` directory and configure your MySQL connection settings.

3. Set up the frontend:

   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the MySQL server.
2. Run the backend:

   ```bash
   cd backend
   node app.js
   ```

   The backend will be running on `http://localhost:3001`.

3. Run the frontend:

   ```bash
   cd ../frontend
   npm start
   ```

   The frontend will be running on `http://localhost:3000`.

### Folder Structure

**Backend Structure:**

```
backend/
├── app.js
├── database/
│   ├── config/
│   │   └── mysql-config.js
│   ├── db.js
│   ├── models/
│   │   ├── Song.js
│   │   └── User.js
│   ├── repositories/
│   │   ├── song-repository.js
│   │   └── user-repository.js
│   ├── services/
│   │   ├── review-service.js
│   │   └── user-service.js
│   ├── utils/
│   │   ├── error-handler.js
│   │   └── jwt-helper.js
├── config/
├── package.json
└── server/
    └── express-server.js
```

**Frontend Structure:**

```
frontend/
├── public/
│   └── index.html
└── src/
    ├── components/
    │   ├── App.tsx
    │   ├── Header.tsx
    │   ├── Layout.tsx
    │   └── SongList.tsx
    ├── utils/
    │   ├── api.ts
    │   └── api-types.ts
    ├── styles/
    │   ├── global.css
    │   └── index.css
    ├── index.ts
    └── package.json
```

### API Endpoints

- **GET /songs**: Retrieve a list of songs.
- **GET /songs/:id**: Retrieve a single song by ID.
- **POST /reviews**: Create a new review for a song. (Requires authenticated user with review permissions).
- **GET /users**: Retrieve a list of users.
- **GET /users/:id**: Retrieve a single user by ID.
- **POST /users**: Create a new user.






