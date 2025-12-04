# GEMINI.md: Project Overview - Luggage Storage Finder Service

This document provides a comprehensive overview of the `luggage-storage-finder` project, detailing its purpose, architecture, key technologies, and operational instructions. It is intended to serve as a foundational context for future interactions with the Gemini CLI.

## 1. Project Overview

The `luggage-storage-finder` is a web application designed to help users find luggage storage locations. It features a Node.js backend (Express.js) with a MongoDB database (Mongoose ODM) and a frontend built with HTML, CSS (Tailwind CSS), and JavaScript. The project includes both a public-facing user interface and a separate administrator panel for managing storage locations, user accounts, and reports. Docker and Docker Compose are utilized for containerization, simplifying development and deployment.

**Key Features:**

*   **Recent Enhancements and Bug Fixes:**
    *   **Map Functionality Enhancements:**
        *   **Corrected Coordinate Handling:** Ensured `latitude` and `longitude` are correctly extracted from `storage.location.coordinates` for map marker display.
        *   **Improved Map Initialization:** Ensured the map is properly initialized and visible when navigating to the "Report" section.
        *   **Reverse Geocoding for Reporting:** Implemented functionality to automatically populate the address field in the report form based on a map click, using Google Maps Geocoding API.
    *   **Report Submission Improvements:**
        *   **Dynamic Form Element Management:** Centralized the creation and management of hidden `lat`/`lng` input fields and `locationInfo` display within `report-form.js` for better consistency.
        *   **Correct Location Data Formatting:** Ensured `lat` and `lng` values from the report form are correctly transformed into the `location: { type: 'Point', coordinates: [lng, lat] }` format for database storage.
        *   **Enhanced UI Feedback on Submission:** Refined the submit button's state management to immediately revert from "Submitting..." to its original text upon successful submission or error, providing clearer user feedback.
    *   **Debugging and Codebase Refinements:**
        *   **Cleaned `publicRoutes.js`:** Removed duplicate code blocks from `src/routes/publicRoutes.js` to improve code integrity.
        *   **Added Debugging Logs:** Integrated detailed `console.log` statements in `map.js` and `report-form.js` to aid in troubleshooting frontend interactions.
        *   **Temporary Backend Adjustment:** Modified `src/routes/publicRoutes.js` to always return all storage locations for debugging purposes (this change can be reverted later if desired).
    *   **CLI Agent-Driven Enhancements (August 2025):**
        *   **Security Enhancement:**
            *   **Google Maps API Key Protection:** Refactored the frontend to prevent the Google Maps API key from being exposed.
                *   Removed the client-side API key endpoint (`/api/maps/key`).
                *   Implemented a new server-side endpoint (`/api/maps/script`) that proxies the Google Maps JavaScript API, securely injecting the API key on the server.
                *   Updated all pages using the Google Maps API to use the new proxied script endpoint.
                *   Added `axios` as a dependency for the new server-side proxy.
        *   **Frontend UI/UX Enhancements:**
            *   **Default View:** Changed the initial page load to display only the map and list sections by default.
            *   **Login/Register UI:** Removed social login buttons (Kakao/Naver) from the login section.
            *   **Report Form - "Use My Location" Feature:** Added a "내 위치 찾기" button to the report form and implemented reverse geocoding to automatically populate the address field. Refactored map-related JavaScript for reusability.
        *   **Authentication & Authorization Refactoring:**
            *   **Middleware Separation:** Modified `src/middleware/auth.js` for general authentication and created `src/middleware/isAdmin.js` for admin-specific authorization.
            *   **Route Protection:** Applied the new `isAdmin` middleware to all admin-specific routes.
            *   **Token Handling:** Improved frontend logic to gracefully handle invalid or expired authentication tokens.
        *   **Bug Fixes:**
            *   Fixed `ReferenceError` and `SyntaxError` in `public/js/main.js` and `public/js/auth.js`.
            *   Resolved incorrect login form submission.
            *   Fixed non-functional mobile logout button.
        *   **Content Updates:**
            *   Updated `public/components/privacy-policy.html` and `public/components/contact-us.html` with richer content and restyled them to match the FAQ page.
            *   Changed the privacy policy contact person to "개인정보팀".

*   **Google Analytics 4 (GA4) Integration:** Implemented GA4 tracking on public and admin pages.
*   **Enhanced SEO:** Dynamic meta tags for improved search engine visibility, and proper logo integration with alt text.
*   **User Authentication:** Secure user login and registration.
*   **Luggage Storage Management:** CRUD operations for luggage storage locations (admin panel).
*   **Reporting System:** Users can report issues or new storage locations, which can be managed by administrators. Enhanced to allow error reporting for existing storage entries.
*   **Admin Dashboard:** Provides an overview of key metrics (storage count, reports, user counts).
*   **Premium Storage Management:** New feature allowing administrators to designate and manage 'premium' luggage storage locations via the admin panel.
*   **Premium Storage Reservation:** Users can request reservations for premium storage locations through a dedicated modal, triggering push notifications to relevant subscribers.
*   **Specific Push Notifications:** Users can subscribe to receive push notifications for updates related to specific premium storage locations.
*   **User Review System:** Frontend UI implemented for users to write and submit reviews for storage locations.
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
    *   **Database Models:** Mongoose schemas and models are defined in `src/models/`. `Storage` model now includes `isPremium` field. `PushSubscription` model includes `storageId` for specific notifications.
    *   **Environment Variables:** Sensitive information and configurations are managed via `.env` files using `dotenv`.
    *   **Password Hashing:** `bcryptjs` is used for secure password storage.
    *   **File Uploads:** `multer` is used for handling file uploads, particularly for CSV data.
    *   **External APIs:** `axios` is used for making HTTP requests to external services (e.g., Google Geocoding API).
    *   **Push Notifications:** Implemented using `web-push` for sending notifications to subscribed users.
*   **Frontend:**
    *   **Structure:** HTML files are in `public/`, with separate directories for admin and shared components.
    *   **Styling:** Primarily uses Tailwind CSS, with some Bootstrap 5 for specific components like modals in the admin panel.
    *   **JavaScript:** Client-side logic is organized into separate files (`public/js/`, `public/admin/js/`). New files include `premium-loader.js`, `reservation-modal.js`, `premium-manager.js`.
    *   **Component Loading:** Admin panel components are dynamically loaded into the `main-content` area based on navigation hash changes.
    *   **User Experience:** Improved navigation, dynamic meta tags, and interactive elements for reservation and review submission.
*   **Testing:**
    *   `playwright test` is configured for end-to-end testing. Test files are located in the `tests/` directory.

---
*   **CLI Agent-Driven Enhancements (December 2025):**
    *   **Enhanced Multi-Location Handling in News:**
        *   **Backend:** `update-news.js` now detects multiple locations within a single news article and saves them as an array in the `NewsArticle` model, which was updated accordingly. This replaces the previous single-location logic with a more dynamic and accurate multi-location geocoding system.
        *   **Frontend:** The news page (`news.html` and `news.js`) was re-engineered to handle articles with multiple locations.
    *   **Advanced Interactive Map and UI:**
        *   **Clickable Location Tags:** News cards now feature clickable tags for each location, allowing users to pan the map to a specific point of interest within the article.
        *   **Mobile-First Map Panel:** A new slide-in panel for the map was implemented for mobile devices, triggered by a Floating Action Button (FAB), significantly improving the user experience on smaller screens.
        *   **Dynamic Content:** The "Nearby Storages" list now has a dynamic title that reflects the currently selected news article and location.
        *   **Enhanced User Interaction:** Clicking on a storage item in the list now pans the map to its location.
    *   **SEO & Analytics:**
        *   Added a `Sitemap` directive to `robots.txt`.
        *   Integrated Google Tag Manager into `news.html` for better analytics.
    *   **Code Refinements:**
        *   Fixed API call consistency in `auth.js`.
        *   Improved error reporting on the news page.
*   **CLI Agent-Driven Enhancements (August 2025):**
    *   **SEO & Site Identity:**
        *   Created `robots.txt` to allow all web crawlers.
        *   Added `favicon.ico` to improve site identity.
        *   Updated `GOOGLE_MAPS_API_KEY` in `.env` to resolve map loading issues.
    *   **News Page Implementation:**
        *   Implemented a new "News & Nearby Info" page (`public/news.html`) with a two-column layout (news articles on left, map on right).
        *   Integrated dynamic news loading from a new backend API endpoint (`/api/news`).
        *   Developed a Mongoose model (`src/models/NewsArticle.js`) and a script (`update-news.js`) to fetch news from NewsAPI.org and store it in the database.
        *   Configured VAPID keys for push notifications in `.env` to ensure the `app` service starts correctly.
        *   Map functionality on the news page now centers on the location related to the news article (or a default Seoul location if no specific location is found).
        *   News articles now display dates.
        *   Implemented click behavior on news cards to update the map and scroll to the map section.
    *   **Bug Fixes & Refinements:**
        *   Corrected API function calls in `public/js/storage-list.js` and `public/js/map.js` to use `api.getStorages()`.
        *   Resolved `net::ERR_NAME_NOT_RESOLVED` errors for placeholder images by switching to `picsum.photos`.
        *   Addressed Google Maps API loading warning by adjusting script attributes in `news.html`.
        *   Fixed `ReferenceError: newsRoutes is not defined` in `app.js`.
        *   Optimized `update-news.js` to reduce memory usage during news fetching and saving.
        *   Corrected `MONGO_URI` in `.env` for Docker Compose environment.