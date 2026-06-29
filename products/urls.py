from django.urls import path
from .views import (
    ProductListAPIView, 
    ProductDetailAPIView, 
    ProductCheckoutAPIView,
    GoogleAuthCallbackView,
    ConfigAPIView
)

urlpatterns = [
    path('', ProductListAPIView.as_view(), name='product-list'),
    path('<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('checkout/', ProductCheckoutAPIView.as_view(), name='product-checkout'),
    path('auth/google/callback/', GoogleAuthCallbackView.as_view(), name='auth-google-callback'),
    path('config/', ConfigAPIView.as_view(), name='config'),
]