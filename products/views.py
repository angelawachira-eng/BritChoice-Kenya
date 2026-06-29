from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductSerializer


class ProductListAPIView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter
    ]

    filterset_fields = [
        'category',
        'brand'
    ]

    search_fields = [
        'product_name',
        'brand',
        'category',
        'full_product_title',
        'description',
        'sku'
    ]


class ProductDetailAPIView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.conf import settings
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import time
import random
import base64
import json
import urllib.request
from urllib.error import URLError

@method_decorator(csrf_exempt, name='dispatch')
class GoogleAuthCallbackView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        token = request.data.get('credential')
        if not token:
            return redirect('/')
            
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode())
                    email = payload.get('email')
                    name = payload.get('name', '')
                    
                    if email:
                        user_data = {
                            "name": name,
                            "email": email
                        }
                        json_str = json.dumps(user_data)
                        b64_str = base64.b64encode(json_str.encode()).decode()
                        
                        res = redirect('/')
                        res.set_cookie('google_user_data', b64_str, max_age=300, samesite='Lax')
                        return res
        except Exception as e:
            print("Google Sign-In Redirect callback verification error:", e)
            
        return redirect('/')

class ConfigAPIView(APIView):
    def get(self, request, *args, **kwargs):
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        return Response({
            "google_client_id": google_client_id
        }, status=status.HTTP_200_OK)

class ProductCheckoutAPIView(APIView):
    def post(self, request, *args, **kwargs):
        items = request.data.get('items', [])
        if not items:
            return Response({"error": "No items in cart"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Step 1: Verify availability for all items first
                for item in items:
                    p_id = item.get('id')
                    qty = int(item.get('quantity', 0))
                    
                    try:
                        product = Product.objects.select_for_update().get(id=p_id)
                    except Product.DoesNotExist:
                        return Response({"error": f"Product with ID {p_id} not found"}, status=status.HTTP_404_NOT_FOUND)
                    
                    if product.stock_count < qty:
                        return Response({
                            "error": f"Insufficient stock for '{product.full_product_title or product.product_name}'",
                            "available_stock": product.stock_count
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                # Step 2: Deduct stock if all are available
                for item in items:
                    p_id = item.get('id')
                    qty = int(item.get('quantity', 0))
                    product = Product.objects.select_for_update().get(id=p_id)
                    product.stock_count -= qty
                    product.save()
                    
            # Generate a stateless unique order confirmation ID
            order_num = f"{int(time.time()) % 100000:05d}{random.randint(10, 99)}"
            order_id = f"BC-{order_num}"
            
            return Response({
                "message": "Stock reduced successfully",
                "order_id": order_id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


