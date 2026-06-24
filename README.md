# BritChoice Kenya — Premium UK Imports

[![Django Version](https://img.shields.io/badge/Django-6.0.6-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF Version](https://img.shields.io/badge/DRF-3.17.1-red?style=flat-square)](https://www.django-rest-framework.org/)
[![PWA](https://img.shields.io/badge/PWA-Installable-blueviolet?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**BritChoice Kenya** is a premium shopping hub and installable Progressive Web App (PWA) dedicated to bringing genuine, high-quality household, skincare, supplement, and detergent brands from the UK straight to Nairobi, Kenya. Sourced directly from UK stores by founders **Peter & Maggie**, warehousing stock locally, and ready for instant checkout order reservation via WhatsApp.

---

## 🌟 Key Features

*   **Premium Glassmorphic UI**: Sleek dark modes, modern typography (Outfit & Plus Jakarta Sans), smooth transition micro-animations, and responsive mobile-first layouts.
*   **Progressive Web App (PWA)**: Installable directly on iOS and Android home screens with offline support, app shell caching, and a custom **Smartphone Add** installation trigger.
*   **WhatsApp Ordering Cart**: Dynamic shopping cart where final checkouts seamlessly launch direct WhatsApp messages to conclude purchases with the managers.
*   **Simple Excel Inventory Management**: Update products, brands, pricing, and stock counts in a standard Excel spreadsheet (`BritChoice_Product_Inventory.xlsx`) and sync it to the database with a single command.
*   **Multi-Language Translation**: Seamless localized switching using Google Translate integrated directly into the header.
*   **Interactive Maps**: Direct location navigation to pick-up spots in Nairobi using Leaflet maps.

---

## 🛠️ Technology Stack

*   **Backend**: Django (Python), Django REST Framework, SQLite (Database), Pandas & OpenPyXL (Excel integration).
*   **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom styling system), Vanilla JavaScript (ES6+), custom lightweight vector icon framework.
*   **Deployment Assets**: WhiteNoise for static asset compression and caching.

---

## 🚀 Local Installation & Setup

Follow these steps to run the application locally on your machine:

### 1. Prerequisites
Ensure you have **Python 3.10+** installed.

### 2. Clone the Repository
```bash
git clone https://github.com/angelawachira-eng/BritChoice-Kenya.git
cd BritChoice-Kenya
```

### 3. Create & Activate Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Compile Static Assets
```bash
python manage.py collectstatic --noinput
```

### 6. Run the Local Server
```bash
python manage.py runserver
```
The site will be live locally at: `http://127.0.0.1:8000`

---

## 📦 Managing Stock & Synchronizing Catalog

All stock, pricing, and description updates are handled through the spreadsheet located in `Inventory/BritChoice_Product_Inventory.xlsx`.

To update the website inventory:
1.  Open the Excel file: `Inventory/BritChoice_Product_Inventory.xlsx`.
2.  Add new items, update existing prices, or modify the **Stock Count** column (e.g. reduce stock or set to `0` for out-of-stock).
3.  Save and close the file.
4.  Run the synchronization script in your terminal:
    ```powershell
    .\venv\Scripts\python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); django.setup(); from products.import_products import run; run()"
    ```
    *This script will update all live details and automatically purge any products deleted from the Excel sheet from the database.*

---

## 📱 PWA Installation Note
To test the Progressive Web App features on a mobile device, serve the app using a secure HTTPS connection. You can use free tunneling tools like **Cloudflare Tunnels** or **ngrok**:
```bash
# Cloudflare Tunnels (No warnings, recommended)
cloudflared tunnel --url http://localhost:8000

# ngrok
ngrok http 8000
```
