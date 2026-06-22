from django.db import models

class Product(models.Model):
    sku = models.CharField("SKU", max_length=100, unique=True)

    category = models.CharField(max_length=100, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)

    product_name = models.CharField(max_length=255)
    variant = models.CharField(max_length=100, blank=True, null=True)
    size_qty = models.CharField(max_length=100, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)

    full_product_title = models.CharField(max_length=500, blank=True, null=True)

    description = models.TextField(blank=True, null=True)

    stock_count = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    image_path = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.full_product_title or self.product_name