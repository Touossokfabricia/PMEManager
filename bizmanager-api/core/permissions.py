from rest_framework.permissions import BasePermission
from core.models import Entreprise


class IsSystemAdmin(BasePermission):
    """Autorise uniquement les comptes role='admin' (Administrateur du diagramme)."""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.role == 'admin' or user.is_superuser))


class IsEntrepreneur(BasePermission):
    """Autorise uniquement les comptes role='entrepreneur'."""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'entrepreneur')


class IsEntrepriseOwner(BasePermission):
    """
    Vérifie que l'entreprise ciblée par l'URL (paramètre entreprise_id) appartient
    bien à l'entrepreneur connecté. Utilisée par toutes les ressources imbriquées
    sous /api/entreprises/<entreprise_id>/... (clients, produits, factures, etc.).
    """
    message = "Cette entreprise ne vous appartient pas."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.role == 'entrepreneur'):
            return False
        entreprise_id = view.kwargs.get('entreprise_id')
        if not entreprise_id:
            return False
        return Entreprise.objects.filter(id=entreprise_id, entrepreneur=user).exists()
