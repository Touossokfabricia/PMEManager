"""
URL configuration for bizmanager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin as django_admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', django_admin.site.urls),
    path('api/', include('core.urls')),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
