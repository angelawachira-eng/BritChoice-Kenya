import pandas as pd
from products.models import Product

def run():
    df = pd.read_excel("Inventory/BritChoice_Product_Inventory.xlsx", header=3)
    df.columns = df.columns.str.strip()

    for _, row in df.iterrows():
        # Clean up Pandas float conversion for integers
        size_raw = row["Size / Qty"]
        size_qty = ""
        if pd.notna(size_raw):
            try:
                if isinstance(size_raw, (float, int)):
                    if size_raw == int(size_raw):
                        size_qty = str(int(size_raw))
                    else:
                        size_qty = str(size_raw)
                else:
                    size_qty = str(size_raw).strip()
                    if size_qty.endswith('.0'):
                        size_qty = size_qty[:-2]
            except Exception:
                size_qty = str(size_raw)

        Product.objects.update_or_create(
            sku=row["Product SKU"],
            defaults={
                "category": row["Category"],
                "brand": row["Brand"],
                "product_name": row["Product Name"],
                "variant": row["Variant"],
                "size_qty": size_qty,
                "unit": row["Unit"],
                "full_product_title": row["Full Product Title"],
                "description": row["Description"],
                "stock_count": row["Stock Count"],
                "price": row["Price (KES)"],
                "image_path": row["Image File Path"],
            }
        )

    print("Full sync completed successfully")