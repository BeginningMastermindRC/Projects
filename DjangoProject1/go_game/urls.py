from django.urls import path
from . import views

urlpatterns = [
    path('', views.board, name='go_board'),
    path('rules/', views.rules, name='go_rules'),
]