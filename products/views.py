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
                    
            return Response({"message": "Stock reduced successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)