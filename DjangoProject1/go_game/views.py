from django.shortcuts import render

def board(request):
    return render(request, "go_game/board.html")

def rules(request):
    return render(request, "go_game/rules.html")