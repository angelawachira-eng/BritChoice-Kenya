from django.db import models

class Product(models.Model):
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)

    name = models.CharField(max_length=255)

    full_title = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    category = models.CharField(max_length=100, blank=True, null=True)

    brand = models.CharField(max_length=100, blank=True, null=True)

    variant = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    size_qty = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    unit = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    price = models.DecimalField(max_digits=10, decimal_places=2)

    stock = models.IntegerField()

    description = models.TextField(blank=True)

    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True
    )

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"BC-{self.id or ''}{self.name[:3].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_title or self.name