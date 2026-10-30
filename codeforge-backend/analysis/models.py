from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Stores additional metadata and tier details for registered users."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=100, default="Software Engineer")
    tier = models.CharField(max_length=50, default="Pro Developer")
    avatar = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} ({self.user.email})"


class LoginRecord(models.Model):
    """Tracks login and registration activity history."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_records", null=True, blank=True)
    identifier = models.CharField(max_length=150)
    action = models.CharField(max_length=30, default="LOGIN")  # LOGIN / REGISTER
    status = models.CharField(max_length=20, default="SUCCESS")  # SUCCESS / FAILED
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.action} - {self.identifier} ({self.status}) at {self.timestamp}"


class Analysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="analyses", null=True, blank=True)
    filename = models.CharField(max_length=200, default="pasted.py")
    code = models.TextField()
    status = models.CharField(max_length=12, default="QUEUED")  # QUEUED/RUNNING/COMPLETED/FAILED
    stage = models.IntegerField(default=0)  # progress steps ke liye
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return f"{self.filename} ({self.status}) - {self.user.username if self.user else 'Guest'}"


class Issue(models.Model):
    analysis = models.ForeignKey(Analysis, on_delete=models.CASCADE, related_name="issues")
    title = models.CharField(max_length=300)
    severity = models.CharField(max_length=10)  # high / medium / low / critical
    confidence = models.FloatField()
    line = models.IntegerField()
    rule = models.CharField(max_length=40)
    source = models.CharField(max_length=40)  # Ruff / Bandit / ML
    what = models.TextField(blank=True)
    why = models.TextField(blank=True)
    how = models.TextField(blank=True)
    fix_diff = models.TextField(blank=True)
    validation = models.CharField(max_length=12, blank=True)
    fixed_code = models.TextField(blank=True, default="")
    status = models.CharField(max_length=12, blank=True, default="")  # applied / rejected / ignored
