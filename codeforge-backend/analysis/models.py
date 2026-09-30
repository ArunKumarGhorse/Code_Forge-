from django.db import models


class Analysis(models.Model):
    filename = models.CharField(max_length=200, default="pasted.py")
    code = models.TextField()
    status = models.CharField(max_length=12, default="QUEUED")  # QUEUED/RUNNING/COMPLETED/FAILED
    stage = models.IntegerField(default=0)  # progress steps ke liye
    created = models.DateTimeField(auto_now_add=True)


class Issue(models.Model):
    analysis = models.ForeignKey(Analysis, on_delete=models.CASCADE, related_name="issues")
    title = models.CharField(max_length=300)
    severity = models.CharField(max_length=10)  # high / medium / low
    confidence = models.FloatField()
    line = models.IntegerField()
    rule = models.CharField(max_length=40)
    source = models.CharField(max_length=40)  # Ruff / Bandit
    what = models.TextField(blank=True)
    why = models.TextField(blank=True)
    how = models.TextField(blank=True)
    fix_diff = models.TextField(blank=True)
    validation = models.CharField(max_length=12, blank=True)