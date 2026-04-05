from datetime import date

from django.views.generic import ListView
from .models import ToDoItem
from django.shortcuts import render

class AllToDos(ListView):
    model = ToDoItem
    template_name = "todo/index.html"

class TodayToDos(ListView):
    model = ToDoItem
    template_name = "todo/today.html"

    def get_queryset(self):
        return ToDoItem.objects.filter(due_date=date.today())


def board(request):
    return render(request, "go_game/board.html")