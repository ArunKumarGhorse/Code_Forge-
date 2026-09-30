from django.urls import path
from . import views

urlpatterns = [
    path("analyses/", views.create_analysis),
    path("analyses/<int:pk>/", views.analysis_detail),
    path("analyses/<int:pk>/issues/", views.analysis_issues),
]