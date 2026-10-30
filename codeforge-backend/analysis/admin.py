from django.contrib import admin
from .models import Analysis, Issue, UserProfile, LoginRecord


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "role", "tier", "created_at", "last_login_at")
    search_fields = ("user__username", "user__email", "name")


@admin.register(LoginRecord)
class LoginRecordAdmin(admin.ModelAdmin):
    list_display = ("identifier", "action", "status", "timestamp", "ip_address")
    list_filter = ("action", "status")
    search_fields = ("identifier", "ip_address")


@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ("filename", "user", "status", "stage", "created")
    list_filter = ("status", "created")
    search_fields = ("filename", "user__username")


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ("title", "analysis", "severity", "confidence", "line", "source", "status")
    list_filter = ("severity", "source", "status")
    search_fields = ("title", "rule")
