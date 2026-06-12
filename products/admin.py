from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'brand', 'category', 'price', 'stock')
    search_fields = ('name', 'sku', 'brand')
    list_filter = ('brand', 'category')

# Register your models here.
