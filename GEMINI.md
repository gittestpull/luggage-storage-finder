```markdown
# GEMINI.md: Project Overview - Luggage Storage Finder Service

This document provides a comprehensive overview of the `luggage-storage-finder` project, detailing its purpose, architecture, key technologies, and operational instructions. It is intended to serve as a foundational context for future interactions with the Gemini CLI.

## 1. Project Overview

The `luggage-storage-finder` is a web application designed to help users find luggage storage locations. It features a Node.js backend (Express.js) with a MongoDB database (Mongoose ODM) and a frontend built with HTML, CSS (Tailwind CSS), and JavaScript. The project includes both a public-facing user interface and a separate administrator panel for managing storage locations, user accounts, and reports. Docker and Docker Compose are utilized for containerization, simplifying development and deployment.

**Key Features:**

*   **User Authentication:** Secure user login and registration.
*   **Luggage Storage Management:** CRUD operations for luggage storage locations (admin panel).
*   **Reporting System:** Users can report issues or new storage locations, which can be managed by administrators.
*   **Admin Dashboard:** Provides an overview of key metrics (storage count, reports, user counts).
*   **Geocoding:** Integration with Google Maps API for location services.
*   **CSV Upload:** Bulk upload of storage data via CSV (admin panel).

**Architecture:**

The application follows a client-server architecture:

*   **Frontend:** Static HTML, CSS, and JavaScript files served from the `public/` directory. The admin panel (`public/admin/`) uses a dynamic component loading approach. Bootstrap 5 is used for modal functionalities in the admin panel.
*   **Backend:** An Express.js application (`app.js`) handling API requests, database interactions, and business logic. API routes are organized under `src/routes/`.
*   **Database:** MongoDB, accessed via Mongoose, stores user, storage, and report data.
*   **Containerization:** Docker and Docker Compose are used to containerize the Node.js application and MongoDB, ensuring consistent environments.

## 2. Building and Running

This project can be built and run using Node.js directly or via Docker Compose.

### 2.1. Using Docker Compose (Recommended)

Docker Compose is the recommended way to run this project as it manages both the Node.js application and the MongoDB database.

**Prerequisites:**
*   Docker and Docker Compose installed on your system.

**Commands:**

*   **Build and Start Services:**
    ```bash
    docker-compose up --build -d
    ```
    This command builds the Docker images (if not already built or if changes are detected in the Dockerfile) and starts the `app` and `mongo` services in detached mode.

*   **Stop Services:**
    ```bash
    docker-compose down
    ```
    This command stops and removes the containers, networks, and volumes created by `up`.

*   **Rebuild and Restart Services (Force Recreate):**
    ```bash
    docker-compose up -d --force-recreate --build
    ```
    Use this after making changes to the Dockerfile or if you want to ensure all services are rebuilt and restarted from scratch.

*   **Execute Commands inside App Container:**
    ```bash
    docker-compose exec app <command>
    # Example: docker-compose exec app node create-admin.js
    ```

### 2.2. Using Node.js Directly (Development Only)

This method requires Node.js and MongoDB to be installed and running separately on your machine.

**Prerequisites:**
*   Node.js (v14.0.0 or higher, as specified in `package.json`)
*   MongoDB server running locally (e.g., on `mongodb://localhost:27017`)

**Commands:**

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Start the Application in Development Mode (with nodemon):**
    ```bash
    npm run dev
    ```
    This uses `nodemon` to automatically restart the server on file changes.

*   **Start the Application in Production Mode:**
    ```bash
    npm start
    ```

*   **Run Tests:**
    ```bash
    npm test
    ```

### 2.3. Initial Setup

*   **Environment Variables:** Copy `.env.example` to `.env` and fill in the necessary environment variables, especially `MONGO_URI` and `JWT_SECRET`.
    *   For Docker Compose, `MONGO_URI` should typically be `mongodb://mongo:27017/luggage-storage`.
    *   For local Node.js, `MONGO_URI` should be `mongodb://localhost:27017/luggage-storage`.
*   **Create Admin User:** Run the `create-admin.js` script to create an initial administrator account.
    ```bash
    # If using Docker Compose
    docker-compose exec app node create-admin.js

    # If using Node.js directly
    node create-admin.js
    ```
*   **Create Test User:** Run the `create-user.js` script to create a non-admin user for testing.
    ```bash
    # If using Docker Compose
    docker-compose exec app node create-user.js <username> <password>

    # If using Node.js directly
    node create-user.js <username> <password>
    ```

## 3. Development Conventions

*   **Backend (Node.js/Express):**
    *   **API Structure:** Routes are defined in `src/routes/` and mounted under `/api`.
    *   **Authentication:** JWT-based authentication is used, with middleware in `src/middleware/auth.js`.
    *   **Database Models:** Mongoose schemas and models are defined in `src/models/`.
    *   **Environment Variables:** Sensitive information and configurations are managed via `.env` files using `dotenv`.
    *   **Password Hashing:** `bcryptjs` is used for secure password storage.
    *   **File Uploads:** `multer` is used for handling file uploads, particularly for CSV data.
    *   **External APIs:** `axios` is used for making HTTP requests to external services (e.g., Google Geocoding API).
*   **Frontend:**
    *   **Structure:** HTML files are in `public/`, with separate directories for admin and shared components.
    *   **Styling:** Primarily uses Tailwind CSS, with some Bootstrap 5 for specific components like modals in the admin panel.
    *   **JavaScript:** Client-side logic is organized into separate files (`public/js/`, `public/admin/js/`) and dynamically loaded as needed.
    *   **Component Loading:** Admin panel components are dynamically loaded into the `main-content` area based on navigation hash changes.
*   **Testing:**
    *   `playwright test` is configured for end-to-end testing. Test files are located in the `tests/` directory.

---
```