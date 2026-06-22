"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

def home(request):
    file_path = os.path.join(settings.BASE_DIR, 'frontend', 'index.html')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        response = HttpResponse(content, content_type='text/html')
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
    return HttpResponse("Frontend index.html not found 🚀", status=404)

def service_worker(request):
    file_path = os.path.join(settings.BASE_DIR, 'frontend', 'sw.js')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        response = HttpResponse(content, content_type='application/javascript')
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
    return HttpResponse("// Service worker not found", status=404, content_type='application/javascript')

urlpatterns = [
    path('', home),
    path('sw.js', service_worker),
    path('admin/', admin.site.urls),

    path('api/products/', include('products.urls')),
]

if settings.DEBUG:
    urlpatterns += static('/Product_Images/', document_root=settings.BASE_DIR / 'Product_Images')