import threading

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Analysis
from .runner import run_analysis
from .serializers import AnalysisSerializer, IssueSerializer


@api_view(["POST"])
def create_analysis(request):
    code = request.data.get("code", "")
    if not code.strip():
        return Response({"error": "Code is empty"}, status=400)
    a = Analysis.objects.create(filename=request.data.get("filename", "pasted.py"), code=code, stage=1)
    threading.Thread(target=run_analysis, args=(a.id,)).start()
    return Response(AnalysisSerializer(a).data, status=201)


@api_view(["GET"])
def analysis_detail(request, pk):
    return Response(AnalysisSerializer(get_object_or_404(Analysis, pk=pk)).data)


@api_view(["GET"])
def analysis_issues(request, pk):
    a = get_object_or_404(Analysis, pk=pk)
    return Response({
        "filename": a.filename,
        "code": a.code,
        "issues": IssueSerializer(a.issues.all().order_by("line"), many=True).data,
    })