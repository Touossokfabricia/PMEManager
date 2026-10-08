from rest_framework import mixins, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count

from core.models import Entreprise, CustomUser
from core.serializers import EntrepriseSerializer, AdminUserSerializer
from core.permissions import IsSystemAdmin


@api_view(['GET'])
@permission_classes([IsSystemAdmin])
def admin_dashboard_view(request):
    entreprises = Entreprise.objects.annotate(nb_employes=Count('employes')).order_by('-date_creation')
    total_entreprises = entreprises.count()
    total_utilisateurs = CustomUser.objects.exclude(role='admin').count()

    return Response({
        "entreprises": EntrepriseSerializer(entreprises[:5], many=True).data,
        "total_entreprises": total_entreprises,
        "total_utilisateurs": total_utilisateurs,
    })


class AdminEntrepriseViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """ConsulterStatistiqueDeL'application : vue globale, lecture seule
    (un admin ne modifie pas les entreprises des entrepreneurs)."""
    permission_classes = [IsSystemAdmin]
    queryset = Entreprise.objects.annotate(nb_employes=Count('employes')).order_by('-date_creation')
    serializer_class = EntrepriseSerializer


class AdminUserViewSet(viewsets.ModelViewSet):
    """GererUtilisateur : CRUD complet (créer, consulter, modifier le rôle/statut,
    supprimer) sur les comptes entrepreneurs de la plateforme."""
    permission_classes = [IsSystemAdmin]
    queryset = CustomUser.objects.exclude(role='admin').order_by('-date_joined')
    serializer_class = AdminUserSerializer
