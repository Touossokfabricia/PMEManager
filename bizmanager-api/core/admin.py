from django.contrib import admin
from core.models import (
    CustomUser, Entreprise, Employe, EvenementEmploye, Client, Produit, Service,
    Facture, LigneFacture, AuditVente, PrevisionStock, Notification,
    ConversationIA, MessageIA,
)

admin.site.register(CustomUser)
admin.site.register(Entreprise)
admin.site.register(Employe)
admin.site.register(EvenementEmploye)
admin.site.register(Client)
admin.site.register(Produit)
admin.site.register(Service)
admin.site.register(Facture)
admin.site.register(LigneFacture)
admin.site.register(AuditVente)
admin.site.register(PrevisionStock)
admin.site.register(Notification)
admin.site.register(ConversationIA)
admin.site.register(MessageIA)
