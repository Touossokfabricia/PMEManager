from django.urls import path
from core.views import auth, tenant, admin, assistant


def crud_urls(prefix, viewset, lookup='pk'):
    return [
        path(f'entreprises/<int:entreprise_id>/{prefix}/',
             viewset.as_view({'get': 'list', 'post': 'create'})),
        path(f'entreprises/<int:entreprise_id>/{prefix}/<int:{lookup}>/',
             viewset.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    ]


urlpatterns = [
    # --- Auth / Profil ---
    path('auth/login/', auth.login_view, name='api_login'),
    path('auth/register/', auth.register_view, name='api_register'),
    path('auth/me/', auth.me_view, name='api_me'),
    path('auth/change-password/', auth.change_password_view, name='api_change_password'),

    # --- Assistant IA (ChatterAvecIA) — historique de conversations ---
    path('assistant/conversations/',
         assistant.ConversationIAViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('assistant/conversations/<int:pk>/',
         assistant.ConversationIAViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'})),
    path('assistant/conversations/<int:pk>/envoyer/',
         assistant.ConversationIAViewSet.as_view({'post': 'envoyer'})),

    # --- Mes entreprises ---
    path('entreprises/', tenant.EntrepriseViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('entreprises/<int:pk>/', tenant.EntrepriseViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    })),

    # --- Ressources imbriquées sous une entreprise ---
    path('entreprises/<int:entreprise_id>/dashboard/', tenant.dashboard_view),
    path('entreprises/<int:entreprise_id>/rupture-stock/', tenant.rupture_stock_view),
    path('entreprises/<int:entreprise_id>/audit-ventes/', tenant.audit_ventes_view),
    path('entreprises/<int:entreprise_id>/factures/<int:pk>/pdf/', tenant.facture_pdf_view),
    path('entreprises/<int:entreprise_id>/factures/<int:pk>/valider/',
         tenant.FactureViewSet.as_view({'post': 'valider'})),
    path('entreprises/<int:entreprise_id>/factures/<int:pk>/annuler/',
         tenant.FactureViewSet.as_view({'post': 'annuler'})),
    path('entreprises/<int:entreprise_id>/factures/<int:pk>/marquer-payee/',
         tenant.FactureViewSet.as_view({'post': 'marquer_payee'})),
    path('entreprises/<int:entreprise_id>/previsions/generer/<int:produit_id>/',
         tenant.PrevisionStockViewSet.as_view({'post': 'generer'})),

    *crud_urls('employes', tenant.EmployeViewSet),
    *crud_urls('clients', tenant.ClientViewSet),
    *crud_urls('produits', tenant.ProduitViewSet),
    *crud_urls('services', tenant.ServiceViewSet),
    *crud_urls('factures', tenant.FactureViewSet),
    *crud_urls('previsions', tenant.PrevisionStockViewSet),
    *crud_urls('evenements-employe', tenant.EvenementEmployeViewSet),

    # Audits : lecture seule
    path('entreprises/<int:entreprise_id>/audits/',
         tenant.AuditVenteViewSet.as_view({'get': 'list'})),
    path('entreprises/<int:entreprise_id>/audits/<int:pk>/',
         tenant.AuditVenteViewSet.as_view({'get': 'retrieve'})),

    # Notifications
    path('entreprises/<int:entreprise_id>/notifications/',
         tenant.NotificationViewSet.as_view({'get': 'list'})),
    path('entreprises/<int:entreprise_id>/notifications/<int:pk>/lue/',
         tenant.NotificationViewSet.as_view({'patch': 'marquer_lue'})),
    path('entreprises/<int:entreprise_id>/notifications/tout-lire/',
         tenant.NotificationViewSet.as_view({'post': 'tout_marquer_lu'})),

    # --- Admin système ---
    path('admin/dashboard/', admin.admin_dashboard_view, name='api_admin_dashboard'),
    path('admin/entreprises/', admin.AdminEntrepriseViewSet.as_view({'get': 'list'})),
    path('admin/entreprises/<int:pk>/', admin.AdminEntrepriseViewSet.as_view({'get': 'retrieve'})),
    path('admin/users/', admin.AdminUserViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('admin/users/<int:pk>/', admin.AdminUserViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    })),
]
