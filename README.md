# BritChoice Kenya — Premium UK Imports

Welcome to the BritChoice Kenya project! 

This is the online store created for Peter and Maggie to manage their imports business in Nairobi. It is designed to be simple, clean, and easy to run without needing a complex tech background.

---

## 🛍️ How the Shop Works

*   **The Catalog**: Customers can browse premium British brands (detergents, skincare, supplements, etc.) on their computers or phones.
*   **The Mobile App**: The website can be saved as an app on phone home screens for quick access.
*   **WhatsApp Checkout**: When a customer is ready to buy, checking out their cart automatically opens a WhatsApp chat with Peter and Maggie containing the order details, so they can finalize the sale and coordinate pickup.
*   **Excel Catalog Updates**: All product details, prices, and stock quantities are managed in a single Excel spreadsheet. 

---

## 📦 How to Update Your Stock and Prices

Whenever you sell items, receive new stock, or need to change prices, you manage it directly inside the Excel file:

1.  Open the Excel spreadsheet: **`Inventory/BritChoice_Product_Inventory.xlsx`**
2.  Find the product you want to change.
3.  Update the **Stock Count** or **Price (KES)** column. 
    *   If you run out of an item, change the stock count to `0` (it will show as "Out of Stock" on the website).
    *   If you want to remove an item permanently, delete the row.
4.  Save and close the Excel file.
5.  Open your computer's terminal (PowerShell or Command Prompt) in the project folder and run this single command to update the website:
    ```powershell
    .\venv\Scripts\python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); django.setup(); from products.import_products import run; run()"
    ```

---

## 💻 How to Start the Website on Your Computer

If you need to run the website locally for testing:

1.  Open your terminal inside the project folder.
2.  Run these commands to start the server:
    ```powershell
    .\venv\Scripts\activate
    python manage.py runserver
    ```
3.  Open your web browser and go to: `http://127.0.0.1:8000`

---

## 📱 How to Open the Site on Other Phones

If you want to view the site on your phone or show it to family and friends:

1.  Keep the website server running on your computer.
2.  Open a new terminal window and run this command:
    ```powershell
    cloudflared tunnel --url http://localhost:8000
    ```
3.  Copy the web address ending in `.trycloudflare.com` and send it to your phone.
