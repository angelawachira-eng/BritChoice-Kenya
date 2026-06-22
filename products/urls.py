from django.urls import path
from .views import ProductListAPIView, ProductDetailAPIView, ProductCheckoutAPIView

urlpatterns = [
    path('', ProductListAPIView.as_view(), name='product-list'),
    path('<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('checkout/', ProductCheckoutAPIView.as_view(), name='product-checkout'),
]