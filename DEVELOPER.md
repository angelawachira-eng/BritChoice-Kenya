# BritChoice Kenya — Developer & Operations Guide

This guide is for Peter, Maggie, and developers managing the BritChoice Kenya platform. It covers local development, inventory syncing, and publishing updates to production.

---

## 💻 Local Development Setup

If you need to run the website locally on your computer for testing or development:

1. **Activate the Virtual Environment**:
   ```powershell
   .\venv\Scripts\activate
   ```
2. **Start the Django Server**:
   ```powershell
   python manage.py runserver
   ```
3. **Access the Site**: Open your web browser and go to `http://127.0.0.1:8000`.

---

## 📱 Testing on Other Devices (Mobile)

To preview the local site on your phone or show it to others without deploying:
1. Keep the local Django server running.
2. In a new terminal window, run:
   ```powershell
   cloudflared tunnel --url http://localhost:8000
   ```
3. Copy the secure URL ending in `.trycloudflare.com` and open it on your phone.

---

## 📦 Syncing Stock and Prices (Excel)

All product catalog data is managed inside the Excel inventory sheet: `Inventory/BritChoice_Product_Inventory.xlsx`.

Whenever you update this spreadsheet:
1. Save and close the Excel file.
2. Run this command locally to update your local database:
   ```powershell
   .\venv\Scripts\python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); django.setup(); from products.import_products import run; run()"
   ```

---

## 🚀 Publishing Updates to Production (PythonAnywhere)

To push code fixes, design updates, or inventory sheets live to your cloud server:

### 1. Push changes from your local machine
```powershell
git add .
git commit -m "Update inventory or website assets"
git push origin master
```

### 2. Pull the changes on PythonAnywhere
In the PythonAnywhere Bash console:
```bash
cd ~/BritChoice-Kenya
git pull
```

### 3. Sync the database (Only if Excel was updated)
In the PythonAnywhere Bash console:
```bash
workon venv
python manage.py shell -c "import products.import_products; products.import_products.run()"
```

### 4. Re-collect static assets & Reload the app
If you modified CSS, JS, or HTML layouts:
1. In the PythonAnywhere Bash console:
   ```bash
   workon venv
   python manage.py collectstatic --noinput
   ```
2. In the **Web** tab of the PythonAnywhere Dashboard, click **Reload**.
