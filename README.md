# BritChoice Kenya — Premium UK Imports

BritChoice Kenya is a modern, headless e-commerce web application built to power a premium imports retail business in Nairobi, Kenya. The platform allows customers to browse and order authentic British household goods, detergents, skincare, and health supplements.

---

## 🌍 Live Store
The application is live and accessible globally:  
👉 **[britchoicekenya.pythonanywhere.com](https://britchoicekenya.pythonanywhere.com/)**

---

## 🌟 Key Features

*   **📱 Installable PWA (Progressive Web App)**: Optimized for mobile devices, the web app can be installed directly to home screens and functions seamlessly across all screens.
*   **🛒 Headless Commerce Architecture**: High-speed, interactive client-side catalog coupled with a secure Django REST API backend.
*   **💬 WhatsApp Checkout Integration**: When customers place an order, the system compiles the cart items, calculates totals, verifies M-Pesa transaction codes, and automatically generates a detailed order message sent directly to the store owners on WhatsApp to coordinate delivery.
*   **📊 Excel-Driven Inventory Control**: Features an automated syncing system that allows non-technical business owners to manage products, pricing, stock levels, and images entirely inside a standard Excel spreadsheet.

---

## 🛠️ Technology Stack

*   **Backend**: Python, Django, Django REST Framework
*   **Frontend**: Vanilla HTML5, CSS3, Modern JavaScript (ES6+), Leaflet.js (for delivery coordinates pinning)
*   **Database**: SQLite
*   **Asset Management**: WhiteNoise (compresses and serves assets directly for high performance)
*   **Hosting**: PythonAnywhere (uWSGI application server)

---

## 📂 Documentation

*   For local setup, database sync scripts, and server deployment workflows, refer to the **[DEVELOPER.md](DEVELOPER.md)** guide.
