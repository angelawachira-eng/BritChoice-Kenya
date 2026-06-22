from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'sku',
        'product_name',
        'brand',
        'category',
        'variant',
        'size_qty',
        'unit',
        'price',
        'stock_count'
    )
    list_display_links = ('sku', 'product_name')
    search_fields = ('sku', 'product_name', 'brand', 'category')
    list_filter = ('brand', 'category')

# Register your models here.
