from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from core.models import ConversationIA, MessageIA
from core.serializers import ConversationIASerializer, ConversationIADetailSerializer, MessageIASerializer
from core.services.ia import appeler_gemini, IAIndisponible

SYSTEM_PROMPT = (
    "Tu es l'assistant virtuel de PMEManager, une application web de gestion pour les PME "
    "(clients, produits, services, factures, stock, employés, entreprises multiples). "
    "Tu aides les utilisateurs à comprendre comment utiliser l'application (où trouver une "
    "fonctionnalité, comment créer une facture, valider une facture, gérer le stock, gérer les "
    "promotions/sanctions des employés, etc.) et tu réponds aussi à leurs questions générales sur "
    "l'entrepreneuriat et la gestion d'entreprise. Réponds toujours en français, de façon claire, "
    "concise (quelques phrases) et bienveillante. Si une question sort de ce cadre, réponds "
    "brièvement puis recentre poliment la conversation."
)


def _titre_depuis_message(message):
    message = message.strip()
    return (message[:47] + '...') if len(message) > 50 else (message or 'Nouvelle conversation')


class ConversationIAViewSet(viewsets.ModelViewSet):
    """
    ChatterAvecIA — historique complet des conversations, propre à chaque utilisateur.
    GET/POST      /api/assistant/conversations/
    GET/DELETE    /api/assistant/conversations/{id}/
    POST          /api/assistant/conversations/{id}/envoyer/   { message }
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConversationIA.objects.filter(utilisateur=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationIADetailSerializer
        return ConversationIASerializer

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

    @action(detail=True, methods=['post'], url_path='envoyer')
    def envoyer(self, request, pk=None):
        conversation = get_object_or_404(ConversationIA, id=pk, utilisateur=request.user)
        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({"detail": "Message vide."}, status=400)

        MessageIA.objects.create(conversation=conversation, role='user', contenu=message)

        historique_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in conversation.messages.order_by('date_creation')[:20]:
            historique_messages.append({"role": m.role, "content": m.contenu})

        try:
            reponse_texte = appeler_gemini(historique_messages)
        except IAIndisponible as e:
            return Response({"detail": str(e)}, status=503)

        assistant_msg = MessageIA.objects.create(conversation=conversation, role='assistant', contenu=reponse_texte)

        # Premier échange : on dérive un titre du premier message de l'utilisateur
        if conversation.messages.filter(role='user').count() == 1:
            conversation.titre = _titre_depuis_message(message)
        conversation.save()  # met aussi à jour date_maj (auto_now)

        return Response({
            "conversation": ConversationIASerializer(conversation).data,
            "message": MessageIASerializer(assistant_msg).data,
        })
