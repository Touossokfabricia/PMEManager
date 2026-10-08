from rest_framework import viewsets, mixins
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import timedelta
from io import BytesIO

from core.models import (
    Entreprise, Employe, EvenementEmploye, Client, Produit, Service,
    Facture, AuditVente, PrevisionStock, Notification
)
from core.serializers import (
    EntrepriseSerializer, EmployeSerializer, EvenementEmployeSerializer, ClientSerializer,
    ProduitSerializer, ServiceSerializer, FactureSerializer, AuditVenteSerializer,
    PrevisionStockSerializer, NotificationSerializer,
)
from core.permissions import IsEntrepreneur, IsEntrepriseOwner


# ============================================================
# ENTREPRISES
# ============================================================

class EntrepriseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsEntrepreneur]
    serializer_class = EntrepriseSerializer

    def get_queryset(self):
        return Entreprise.objects.filter(entrepreneur=self.request.user).annotate(
            nb_employes=Count('employes')
        ).order_by('-date_creation')

    def perform_create(self, serializer):
        serializer.save(entrepreneur=self.request.user)


def get_owned_entreprise(request, entreprise_id):
    return get_object_or_404(Entreprise, id=entreprise_id, entrepreneur=request.user)


# ============================================================
# Base commune aux ressources imbriquées sous une entreprise
# ============================================================

class BaseEntrepriseScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsEntrepriseOwner]

    def get_entreprise(self):
        return get_owned_entreprise(self.request, self.kwargs['entreprise_id'])

    def perform_create(self, serializer):
        serializer.save(entreprise=self.get_entreprise())


class EmployeViewSet(BaseEntrepriseScopedViewSet):
    serializer_class = EmployeSerializer

    def get_queryset(self):
        return Employe.objects.filter(entreprise_id=self.kwargs['entreprise_id']).prefetch_related('evenements').order_by('nom')


class EvenementEmployeViewSet(viewsets.ModelViewSet):
    """Promotions / sanctions — imbriquées sous une entreprise (le champ 'employe' est
    fourni dans le payload et validé pour appartenir à cette entreprise)."""
    permission_classes = [IsAuthenticated, IsEntrepriseOwner]
    serializer_class = EvenementEmployeSerializer

    def get_queryset(self):
        return EvenementEmploye.objects.filter(
            employe__entreprise_id=self.kwargs['entreprise_id']
        ).order_by('-date_creation')

    def perform_create(self, serializer):
        employe_id = self.request.data.get('employe')
        employe = get_object_or_404(Employe, id=employe_id, entreprise_id=self.kwargs['entreprise_id'])

        salaire_avant = employe.salaire
        changements = []
        champs_a_sauver = []

        # Changement de poste (typiquement une promotion)
        nouveau_poste = serializer.validated_data.get('nouveau_poste')
        if nouveau_poste:
            ancien_poste = employe.poste or '—'
            employe.poste = nouveau_poste
            champs_a_sauver.append('poste')
            changements.append(f'poste : "{ancien_poste}" → "{nouveau_poste}"')

        # Impact sur le salaire (augmentation ou réduction)
        impact = serializer.validated_data.get('impact_salaire', 'aucun')
        montant = serializer.validated_data.get('montant_impact') or 0
        if impact == 'augmentation' and montant:
            employe.salaire += montant
            champs_a_sauver.append('salaire')
            changements.append(f'salaire augmenté de {montant:.0f} FCFA')
        elif impact == 'reduction' and montant:
            employe.salaire = max(0, employe.salaire - montant)
            champs_a_sauver.append('salaire')
            changements.append(f'salaire réduit de {montant:.0f} FCFA')

        if champs_a_sauver:
            employe.save(update_fields=champs_a_sauver)

        evenement = serializer.save(
            employe=employe, salaire_avant=salaire_avant, salaire_apres=employe.salaire,
        )

        libelle = evenement.get_type_evenement_display()
        if evenement.type_evenement == 'sanction' and evenement.sous_type_sanction:
            libelle = evenement.get_sous_type_sanction_display()

        detail_cause = f" ({', '.join(changements)})" if changements else ""
        Notification.objects.create(
            entreprise_id=self.kwargs['entreprise_id'],
            type_notification=evenement.type_evenement,  # 'promotion' ou 'sanction'
            message=f"{libelle} attribuée à {employe.prenom} {employe.nom}{detail_cause}.",
            lien='/employes',
        )


class ClientViewSet(BaseEntrepriseScopedViewSet):
    serializer_class = ClientSerializer

    def get_queryset(self):
        return Client.objects.filter(entreprise_id=self.kwargs['entreprise_id']).order_by('nom')


class ProduitViewSet(BaseEntrepriseScopedViewSet):
    serializer_class = ProduitSerializer

    def get_queryset(self):
        return Produit.objects.filter(entreprise_id=self.kwargs['entreprise_id']).order_by('nom')


class ServiceViewSet(BaseEntrepriseScopedViewSet):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        return Service.objects.filter(entreprise_id=self.kwargs['entreprise_id']).order_by('nom')


class FactureViewSet(BaseEntrepriseScopedViewSet):
    serializer_class = FactureSerializer

    def get_queryset(self):
        qs = Facture.objects.filter(entreprise_id=self.kwargs['entreprise_id']).order_by('-date_emission')
        client_id = self.request.query_params.get('client')
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['entreprise'] = self.get_entreprise()
        return context

    def perform_create(self, serializer):
        # Créée en BROUILLON : aucun impact stock, aucun audit à ce stade.
        serializer.save()

    def perform_update(self, serializer):
        if not serializer.instance.peut_etre_modifiee:
            raise ValidationError({"detail": "Seules les factures en brouillon peuvent être modifiées."})
        serializer.save()

    def perform_destroy(self, instance):
        if not instance.peut_etre_supprimee:
            raise ValidationError({
                "detail": "Seules les factures en brouillon peuvent être supprimées. "
                           "Une facture validée doit être annulée, pas supprimée."
            })
        instance.delete()

    @action(detail=True, methods=['post'], url_path='valider')
    def valider(self, request, entreprise_id=None, pk=None):
        """Brouillon -> Validée : vérifie le stock, le décrémente, verrouille la facture
        (non modifiable, non supprimable), journalise l'audit de vente."""
        facture = self.get_object()
        if facture.statut != 'brouillon':
            return Response({"detail": "Cette facture n'est plus en brouillon."}, status=400)

        lignes = list(facture.lignes.select_related('produit'))
        for ligne in lignes:
            if ligne.produit and ligne.produit.quantite_stock < ligne.quantite:
                return Response(
                    {"detail": f"Stock insuffisant pour \"{ligne.produit.nom}\" ({ligne.produit.quantite_stock} disponible(s))."},
                    status=400,
                )

        for ligne in lignes:
            if ligne.produit:
                ligne.produit.quantite_stock -= ligne.quantite
                ligne.produit.save(update_fields=['quantite_stock'])

        facture.statut = 'validee'
        facture.stock_deduit = True
        facture.save(update_fields=['statut', 'stock_deduit'])

        AuditVente.objects.create(
            facture=facture, action="Validation de facture",
            details=f"Facture {facture.numero} validée pour {facture.client.nom}.",
            montant_concerne=facture.montant_total,
        )
        for ligne in lignes:
            if ligne.produit and ligne.produit.quantite_stock <= ligne.produit.seuil_alerte:
                Notification.objects.create(
                    entreprise=facture.entreprise, type_notification='stock_critique',
                    message=f"Stock critique : \"{ligne.produit.nom}\" ({ligne.produit.quantite_stock} restant(s)).",
                    lien='/rupture-stock',
                )

        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'], url_path='annuler')
    def annuler(self, request, entreprise_id=None, pk=None):
        """Validée + non payée -> Annulée : restaure le stock si celui-ci avait été déduit."""
        facture = self.get_object()
        if not facture.peut_etre_annulee:
            return Response(
                {"detail": "Seule une facture validée et non payée peut être annulée."},
                status=400,
            )

        if facture.stock_deduit:
            for ligne in facture.lignes.select_related('produit'):
                if ligne.produit_id:
                    ligne.produit.quantite_stock += ligne.quantite
                    ligne.produit.save(update_fields=['quantite_stock'])
            facture.stock_deduit = False

        facture.statut = 'annulee'
        facture.save(update_fields=['statut', 'stock_deduit'])

        AuditVente.objects.create(
            facture=facture, action="Annulation de facture",
            details=f"Facture {facture.numero} annulée ; stock restauré le cas échéant.",
            montant_concerne=facture.montant_total,
        )
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'], url_path='marquer-payee')
    def marquer_payee(self, request, entreprise_id=None, pk=None):
        facture = self.get_object()
        if facture.statut != 'validee':
            return Response({"detail": "Seule une facture validée peut être marquée comme payée."}, status=400)
        facture.statut_paiement = 'paye'
        facture.save(update_fields=['statut_paiement'])
        return Response(FactureSerializer(facture).data)


class AuditVenteViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = AuditVenteSerializer
    permission_classes = [IsAuthenticated, IsEntrepriseOwner]

    def get_queryset(self):
        return AuditVente.objects.filter(
            facture__entreprise_id=self.kwargs['entreprise_id']
        ).order_by('-date_action')


class PrevisionStockViewSet(BaseEntrepriseScopedViewSet):
    serializer_class = PrevisionStockSerializer

    def get_queryset(self):
        return PrevisionStock.objects.filter(
            produit__entreprise_id=self.kwargs['entreprise_id']
        ).order_by('-date_generation')

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'], url_path='generer/(?P<produit_id>[^/.]+)')
    def generer(self, request, entreprise_id=None, produit_id=None):
        """Prévision DYNAMIQUE basée sur l'historique des ventes, analysé par l'IA (Gemini) —
        remplace l'ancien seuil fixe. Si l'IA est indisponible ou l'historique insuffisant,
        on retombe sur une heuristique simple (moyenne × 1.1)."""
        import json
        import re
        from django.db.models.functions import TruncMonth
        from core.models import LigneFacture
        from core.services.ia import appeler_gemini, IAIndisponible

        produit = get_object_or_404(Produit, id=produit_id, entreprise_id=entreprise_id)

        ventes_par_mois = (
            LigneFacture.objects.filter(produit=produit, facture__statut='validee')
            .annotate(mois=TruncMonth('facture__date_emission'))
            .values('mois')
            .annotate(total=Sum('quantite'))
            .order_by('mois')
        )
        historique = [{"mois": v['mois'].strftime('%Y-%m'), "quantite_vendue": v['total']} for v in ventes_par_mois]

        quantite_prevue = None
        niveau_confiance = 0.5
        justification = ""

        if historique:
            prompt = (
                f"Tu es analyste en gestion de stock pour une PME. Voici l'historique des ventes "
                f"mensuelles (en unités) du produit \"{produit.nom}\" : {historique}. "
                f"Stock actuel : {produit.quantite_stock} unités.\n"
                "En te basant sur la tendance, estime la quantité qui sera probablement vendue le "
                "mois prochain, et donne un niveau de confiance entre 0 et 1.\n"
                "Réponds UNIQUEMENT avec un objet JSON strictement de cette forme, sans texte autour, "
                "sans balises markdown : "
                '{"quantite_prevue": <nombre>, "niveau_confiance": <nombre entre 0 et 1>, '
                '"justification": "<une phrase courte en français>"}'
            )
            try:
                reponse = appeler_gemini([{"role": "user", "content": prompt}], temperature=0.2)
                texte = re.sub(r'^```(json)?|```$', '', reponse.strip(), flags=re.MULTILINE).strip()
                data = json.loads(texte)
                quantite_prevue = float(data.get('quantite_prevue'))
                niveau_confiance = max(0.0, min(1.0, float(data.get('niveau_confiance', 0.5))))
                justification = str(data.get('justification', ''))[:255]
            except (IAIndisponible, ValueError, TypeError, json.JSONDecodeError):
                quantite_prevue = None  # bascule sur le repli ci-dessous

        if quantite_prevue is None:
            moyenne = LigneFacture.objects.filter(
                produit=produit, facture__statut='validee'
            ).aggregate(m=Sum('quantite'))['m'] or 0
            quantite_prevue = moyenne * 1.1
            niveau_confiance = 0.4
            justification = justification or "Estimation simplifiée (IA indisponible ou historique insuffisant)."

        prevision = PrevisionStock.objects.create(
            produit=produit, quantite_prevue=quantite_prevue,
            niveau_confiance=niveau_confiance, justification=justification,
        )
        return Response(PrevisionStockSerializer(prevision).data, status=201)


# ============================================================
# NOTIFICATIONS
# ============================================================

def _generer_notifications_retard(entreprise_id):
    """Génère (si pas déjà fait) une notification pour chaque facture qui vient
    de passer en retard. Appelé paresseusement à chaque consultation des
    notifications (pas de tâche planifiée dans ce projet)."""
    factures_en_attente = Facture.objects.filter(entreprise_id=entreprise_id, statut='validee', statut_paiement='en_attente')
    for facture in factures_en_attente:
        if facture.est_en_retard:
            deja_notifie = Notification.objects.filter(
                entreprise_id=entreprise_id, type_notification='facture_retard',
                message__contains=facture.numero,
            ).exists()
            if not deja_notifie:
                Notification.objects.create(
                    entreprise_id=entreprise_id, type_notification='facture_retard',
                    message=f"La facture {facture.numero} ({facture.client.nom}) est en retard de paiement.",
                    lien=f'/factures/{facture.id}',
                )


def _generer_notifications_salaires(entreprise_id):
    """Génère un rappel mensuel de paiement des salaires à partir du jour configuré
    sur l'entreprise (Entreprise.jour_paiement_salaire). Un seul rappel par mois."""
    entreprise = Entreprise.objects.filter(id=entreprise_id).first()
    if not entreprise:
        return
    aujourdhui = timezone.now().date()
    if aujourdhui.day < entreprise.jour_paiement_salaire:
        return

    employes = Employe.objects.filter(entreprise_id=entreprise_id)
    if not employes.exists():
        return

    cle_mois = aujourdhui.strftime('%Y-%m')
    deja_notifie = Notification.objects.filter(
        entreprise_id=entreprise_id, type_notification='salaire_a_payer',
        message__contains=cle_mois,
    ).exists()
    if deja_notifie:
        return

    masse_salariale = employes.aggregate(total=Sum('salaire'))['total'] or 0
    Notification.objects.create(
        entreprise_id=entreprise_id, type_notification='salaire_a_payer',
        message=(
            f"Période {cle_mois} : pensez à payer les salaires de vos {employes.count()} "
            f"employé(s) (masse salariale : {masse_salariale:.0f} FCFA)."
        ),
        lien='/employes',
    )


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsEntrepriseOwner]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        _generer_notifications_retard(self.kwargs['entreprise_id'])
        _generer_notifications_salaires(self.kwargs['entreprise_id'])
        return Notification.objects.filter(entreprise_id=self.kwargs['entreprise_id'])

    @action(detail=True, methods=['patch'], url_path='lue')
    def marquer_lue(self, request, entreprise_id=None, pk=None):
        notif = get_object_or_404(Notification, id=pk, entreprise_id=entreprise_id)
        notif.lue = True
        notif.save(update_fields=['lue'])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='tout-lire')
    def tout_marquer_lu(self, request, entreprise_id=None):
        Notification.objects.filter(entreprise_id=entreprise_id, lue=False).update(lue=True)
        return Response({"detail": "Toutes les notifications ont été marquées comme lues."})


# ============================================================
# Dashboard / rupture de stock
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsEntrepriseOwner])
def facture_pdf_view(request, entreprise_id, pk):
    """Téléchargement de la facture au format PDF."""
    facture = get_object_or_404(Facture, id=pk, entreprise_id=entreprise_id)

    try:
        from xhtml2pdf import pisa
    except ImportError:
        return Response(
            {"detail": "Génération PDF indisponible : exécute 'pip install xhtml2pdf' puis redémarre le serveur."},
            status=501,
        )

    html = render_to_string('facture_pdf.html', {'facture': facture, 'entreprise': facture.entreprise})
    buffer = BytesIO()
    pisa.CreatePDF(html, dest=buffer)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{facture.numero}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsEntrepriseOwner])
def dashboard_view(request, entreprise_id):
    total_clients = Client.objects.filter(entreprise_id=entreprise_id).count()
    total_produits = Produit.objects.filter(entreprise_id=entreprise_id).count()
    factures_recentes = Facture.objects.filter(entreprise_id=entreprise_id).order_by('-date_emission')[:5]

    # Le chiffre d'affaires ne compte que les factures VALIDÉES (les brouillons et
    # les factures annulées n'ont jamais été des ventes réelles).
    chiffre_affaires = Facture.objects.filter(
        entreprise_id=entreprise_id, statut='validee'
    ).aggregate(total=Sum('montant_total'))['total'] or 0

    produits_en_rupture = sum(
        1 for p in Produit.objects.filter(entreprise_id=entreprise_id) if p.quantite_stock <= p.seuil_alerte
    )
    factures_impayees = Facture.objects.filter(
        entreprise_id=entreprise_id, statut='validee', statut_paiement='en_attente'
    ).count()

    # Évolution du CA sur les 6 derniers mois (pour le graphique du dashboard)
    six_mois = timezone.now().date() - timedelta(days=180)
    ventes_par_mois = (
        Facture.objects.filter(entreprise_id=entreprise_id, statut='validee', date_emission__gte=six_mois)
        .annotate(mois=TruncMonth('date_emission'))
        .values('mois')
        .annotate(total=Sum('montant_total'))
        .order_by('mois')
    )
    evolution_ca = [{"mois": v['mois'].strftime('%b %Y'), "total": float(v['total'] or 0)} for v in ventes_par_mois]

    return Response({
        "total_clients": total_clients,
        "total_produits": total_produits,
        "chiffre_affaires": chiffre_affaires,
        "produits_en_rupture": produits_en_rupture,
        "factures_impayees": factures_impayees,
        "factures_recentes": FactureSerializer(factures_recentes, many=True).data,
        "evolution_ca": evolution_ca,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsEntrepriseOwner])
def audit_ventes_view(request, entreprise_id):
    """GenererAuditVentes : agrège les ventes par produit/service (et le total général),
    uniquement à partir des factures VALIDÉES (les brouillons et annulations n'entrent
    pas dans les statistiques de vente)."""
    from core.models import LigneFacture

    lignes = LigneFacture.objects.filter(
        facture__entreprise_id=entreprise_id, facture__statut='validee'
    ).select_related('produit', 'service')

    stats = {}
    for ligne in lignes:
        if ligne.produit_id:
            cle = ('produit', ligne.produit_id)
            nom = ligne.produit.nom
        else:
            cle = ('service', ligne.service_id)
            nom = ligne.service.nom
        entree = stats.setdefault(cle, {
            "type": cle[0], "id": cle[1], "nom": nom,
            "quantite_vendue": 0, "montant_total": 0.0, "nombre_ventes": 0,
        })
        entree["quantite_vendue"] += ligne.quantite
        entree["montant_total"] += float(ligne.montant_ligne)
        entree["nombre_ventes"] += 1

    items = sorted(stats.values(), key=lambda x: x["montant_total"], reverse=True)
    totaux = {
        "quantite_totale": sum(i["quantite_vendue"] for i in items),
        "montant_total": sum(i["montant_total"] for i in items),
        "nombre_factures_validees": Facture.objects.filter(entreprise_id=entreprise_id, statut='validee').count(),
    }
    return Response({"items": items, "totaux": totaux})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsEntrepriseOwner])
def rupture_stock_view(request, entreprise_id):
    """ConsulterRuptureStock : produits sous LEUR PROPRE seuil d'alerte (plus de seuil fixe global)."""
    produits_qs = Produit.objects.filter(entreprise_id=entreprise_id).order_by('quantite_stock')
    produits = [p for p in produits_qs if p.quantite_stock <= p.seuil_alerte]

    return Response({
        "count": len(produits),
        "produits": ProduitSerializer(produits, many=True).data,
    })
