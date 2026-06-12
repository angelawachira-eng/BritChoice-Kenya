import pandas as pd
from products.models import Product

def run():
    df = pd.read_excel(
        "Inventory/BritChoice_Product_Inventory.xlsx",
        header=3
    )

    df.columns = df.columns.str.strip()

    for _, row in df.iterrows():
        Product.objects.update_or_create(
            sku=row["Product SKU"],  # IMPORTANT KEY
            defaults={
                "name": row["Product Name"],
                "category": row["Category"],
                "brand": row["Brand"],
                "price": row["Price (KES)"],
                "stock": row["Stock Count"],
                "description": row["Description"],
            }
        )

    print("Import sync completed successfully!")