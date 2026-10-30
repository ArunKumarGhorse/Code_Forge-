from django.urls import path
from . import views

urlpatterns = [
    path("analyses/", views.create_analysis),
    path("analyses/clear/", views.clear_history),
    path("analyses/<int:pk>/", views.analysis_detail),
    path("analyses/<int:pk>/issues/", views.analysis_issues),
    path("issues/<int:pk>/generate-fix/", views.generate_fix),
    path("issues/<int:pk>/status/", views.update_issue_status),
    path("dashboard/", views.dashboard_data),
    path("auth/login/", views.auth_login),
    path("auth/register/", views.auth_register),
    path("auth/me/", views.auth_me),
    path("auth/users/", views.auth_users),
    path("auth/records/", views.auth_records),
    path("compiler/run/", views.compiler_run),
    path("compiler/complexity/", views.compiler_complexity),
    path("compiler/languages/", views.compiler_languages),
    path("compiler/inspect/", views.compiler_inspect),
    path("chatbot/", views.chatbot),
]