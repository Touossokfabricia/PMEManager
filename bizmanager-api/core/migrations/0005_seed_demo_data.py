"""
Migration de données : insère un jeu de données de démonstration complet
(une entreprise, des clients, produits, services, employés et des factures
dans TOUS les états possibles) afin de pouvoir visualiser immédiatement
l'application sans tout ressaisir à la main.

Compte de connexion créé :
    email    : demo@pmemanager.cm
    password : Demo@1234

Pour annuler cette migration (tout supprimer) :
    python manage.py migrate core 0004
"""
from django.db import migrations
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta


DEMO_EMAIL = 'demo@pmemanager.cm'


def creer_donnees_demo(apps, schema_editor):
    CustomUser = apps.get_model('core', 'CustomUser')
    Entreprise = apps.get_model('core', 'Entreprise')
    Client = apps.get_model('core', 'Client')
    Produit = apps.get_model('core', 'Produit')
    Service = apps.get_model('core', 'Service')
    Employe = apps.get_model('core', 'Employe')
    EvenementEmploye = apps.get_model('core', 'EvenementEmploye')
    Facture = apps.get_model('core', 'Facture')
    LigneFacture = apps.get_model('core', 'LigneFacture')
    AuditVente = apps.get_model('core', 'AuditVente')
    Notification = apps.get_model('core', 'Notification')

    if CustomUser.objects.filter(email=DEMO_EMAIL).exists():
        return  # déjà seedé (ex : migration rejouée sur une base déjà peuplée)

    aujourdhui = timezone.now().date()

    # --- Utilisateur + Entreprise ---
    demo_user = CustomUser.objects.create(
        email=DEMO_EMAIL, nom='Démo', prenom='Compte',
        role='entrepreneur', numrcc='RC/YAO/2026/B/0001',
        password=make_password('Demo@1234'),
        is_active=True, is_staff=False,
    )
    entreprise = Entreprise.objects.create(
        entrepreneur=demo_user, nom='Boutique Démo Yaoundé',
        secteur_activite='Commerce général', localisation='Yaoundé, Cameroun',
    )

    # --- Clients ---
    clients = [
        Client.objects.create(entreprise=entreprise, nom='Ets Mbarga & Fils', contact='677 11 22 33', adresse='Marché Mokolo, Yaoundé'),
        Client.objects.create(entreprise=entreprise, nom='Librairie Centrale', contact='690 44 55 66', adresse='Avenue Kennedy, Yaoundé'),
        Client.objects.create(entreprise=entreprise, nom='Restaurant Le Bon Goût', contact='655 77 88 99', adresse='Bastos, Yaoundé'),
        Client.objects.create(entreprise=entreprise, nom='Mme Ngono Solange', contact='699 12 34 56', adresse='Essos, Yaoundé'),
    ]

    # --- Produits (stocks/seuils volontairement variés pour démontrer les alertes) ---
    produits = [
        Produit.objects.create(entreprise=entreprise, nom='Sac de riz 25kg', reference='PRD-001', prix_vente=18000, prix_achat=15000, quantite_stock=42, seuil_alerte=10),
        Produit.objects.create(entreprise=entreprise, nom="Bidon d'huile 5L", reference='PRD-002', prix_vente=9000, prix_achat=7200, quantite_stock=3, seuil_alerte=5),   # sous le seuil -> rupture
        Produit.objects.create(entreprise=entreprise, nom='Carton de savon (x24)', reference='PRD-003', prix_vente=12000, prix_achat=9500, quantite_stock=0, seuil_alerte=5),   # rupture totale
        Produit.objects.create(entreprise=entreprise, nom='Cahier 200 pages', reference='PRD-004', prix_vente=750, prix_achat=500, quantite_stock=150, seuil_alerte=20),
        Produit.objects.create(entreprise=entreprise, nom='Casier de boissons', reference='PRD-005', prix_vente=6000, prix_achat=4500, quantite_stock=25, seuil_alerte=8),
    ]

    # --- Services ---
    services = [
        Service.objects.create(entreprise=entreprise, nom='Livraison à domicile', description='Livraison dans Yaoundé sous 24h', prix=2000),
        Service.objects.create(entreprise=entreprise, nom='Installation / mise en service', description="Installation sur site pour l'équipement acheté", prix=5000),
    ]

    # --- Employés + événements ---
    employe1 = Employe.objects.create(entreprise=entreprise, nom='Ateba', prenom='Jean', telephone='677001122', poste='Vendeur', salaire=85000, date_embauche=aujourdhui - timedelta(days=400))
    employe2 = Employe.objects.create(entreprise=entreprise, nom='Fouda', prenom='Marie', telephone='699334455', poste='Caissière', salaire=75000, date_embauche=aujourdhui - timedelta(days=200))

    EvenementEmploye.objects.create(
        employe=employe1, type_evenement='promotion',
        description='Passage au poste de Chef de rayon suite aux bons résultats du trimestre.',
        date_debut=aujourdhui - timedelta(days=30),
    )
    EvenementEmploye.objects.create(
        employe=employe2, type_evenement='sanction',
        description='Avertissement pour retards répétés.',
        date_debut=aujourdhui - timedelta(days=15), date_fin=aujourdhui + timedelta(days=15),
    )
    Notification.objects.create(
        entreprise=entreprise, type_notification='promotion',
        message=f"Promotion attribuée à {employe1.prenom} {employe1.nom}.", lien='/employes',
    )

    def creer_ligne(facture, quantite, prix_unitaire, produit=None, service=None):
        return LigneFacture.objects.create(
            facture=facture, produit=produit, service=service,
            quantite=quantite, prix_unitaire=prix_unitaire,
            montant_ligne=quantite * prix_unitaire,
        )

    def finaliser_montant(facture):
        total = sum(l.montant_ligne for l in facture.lignes.all())
        facture.montant_total = total
        facture.save(update_fields=['montant_total'])

    # --- Facture 1 : BROUILLON (non validée, aucun impact stock) ---
    f1 = Facture.objects.create(
        entreprise=entreprise, client=clients[0], numero='FAC-DEMO-0001',
        delai='30j', statut='brouillon', statut_paiement='en_attente',
    )
    creer_ligne(f1, 2, produits[0].prix_vente, produit=produits[0])
    creer_ligne(f1, 1, services[0].prix, service=services[0])
    finaliser_montant(f1)

    # --- Facture 2 : VALIDÉE + PAYÉE ---
    f2 = Facture.objects.create(
        entreprise=entreprise, client=clients[1], numero='FAC-DEMO-0002',
        delai='immediat', statut='validee', statut_paiement='paye', stock_deduit=True,
    )
    creer_ligne(f2, 10, produits[3].prix_vente, produit=produits[3])
    finaliser_montant(f2)
    AuditVente.objects.create(facture=f2, action="Validation de facture", details=f"Facture {f2.numero} validée pour {clients[1].nom}.", montant_concerne=f2.montant_total)

    # --- Facture 3 : VALIDÉE + EN ATTENTE (récente, pas encore en retard) ---
    f3 = Facture.objects.create(
        entreprise=entreprise, client=clients[2], numero='FAC-DEMO-0003',
        delai='30j', statut='validee', statut_paiement='en_attente', stock_deduit=True,
    )
    creer_ligne(f3, 3, produits[4].prix_vente, produit=produits[4])
    creer_ligne(f3, 2, services[1].prix, service=services[1])
    finaliser_montant(f3)
    AuditVente.objects.create(facture=f3, action="Validation de facture", details=f"Facture {f3.numero} validée pour {clients[2].nom}.", montant_concerne=f3.montant_total)

    # --- Facture 4 : VALIDÉE + EN RETARD (émise il y a 20 jours, délai 7j) ---
    f4 = Facture.objects.create(
        entreprise=entreprise, client=clients[3], numero='FAC-DEMO-0004',
        delai='7j', statut='validee', statut_paiement='en_attente', stock_deduit=True,
    )
    creer_ligne(f4, 1, produits[1].prix_vente, produit=produits[1])
    finaliser_montant(f4)
    Facture.objects.filter(pk=f4.pk).update(date_emission=aujourdhui - timedelta(days=20))
    AuditVente.objects.create(facture=f4, action="Validation de facture", details=f"Facture {f4.numero} validée pour {clients[3].nom}.", montant_concerne=f4.montant_total)
    Notification.objects.create(
        entreprise=entreprise, type_notification='facture_retard',
        message=f"La facture {f4.numero} ({clients[3].nom}) est en retard de paiement.", lien=f'/factures/{f4.id}',
    )

    # --- Facture 5 : ANNULÉE (a été validée puis annulée, stock restauré) ---
    f5 = Facture.objects.create(
        entreprise=entreprise, client=clients[0], numero='FAC-DEMO-0005',
        delai='15j', statut='annulee', statut_paiement='en_attente', stock_deduit=False,
    )
    creer_ligne(f5, 1, produits[2].prix_vente, produit=produits[2])
    finaliser_montant(f5)
    AuditVente.objects.create(facture=f5, action="Validation de facture", details=f"Facture {f5.numero} validée pour {clients[0].nom}.", montant_concerne=f5.montant_total)
    AuditVente.objects.create(facture=f5, action="Annulation de facture", details=f"Facture {f5.numero} annulée ; stock restauré.", montant_concerne=f5.montant_total)

    # --- Notification stock critique (huile + savon, déjà sous leur seuil) ---
    Notification.objects.create(
        entreprise=entreprise, type_notification='stock_critique',
        message=f"Stock critique : \"{produits[1].nom}\" ({produits[1].quantite_stock} restant(s)).", lien='/rupture-stock',
    )
    Notification.objects.create(
        entreprise=entreprise, type_notification='stock_critique',
        message=f"Stock critique : \"{produits[2].nom}\" ({produits[2].quantite_stock} restant(s)).", lien='/rupture-stock',
    )


def supprimer_donnees_demo(apps, schema_editor):
    CustomUser = apps.get_model('core', 'CustomUser')
    CustomUser.objects.filter(email=DEMO_EMAIL).delete()  # cascade sur tout le reste


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_facture_statut_facture_stock_deduit'),
    ]

    operations = [
        migrations.RunPython(creer_donnees_demo, reverse_code=supprimer_donnees_demo),
    ]
