from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from datetime import timedelta


# ============================================================
# UTILISATEUR (fusion Utilisateur / Administrateur / Entrepreneur)
# ============================================================

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Fusionne Utilisateur (abstrait), Administrateur et Entrepreneur du diagramme."""

    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('entrepreneur', 'Entrepreneur'),
    ]

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='entrepreneur')

    # Spécifique à Entrepreneur (diagramme) — vide si role = 'admin'
    numrcc = models.CharField("Numéro RCCM", max_length=50, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.get_role_display()})"


# ============================================================
# ENTREPRISE
# ============================================================

class Entreprise(models.Model):
    entrepreneur = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='entreprises',
        limit_choices_to={'role': 'entrepreneur'}
    )
    nom = models.CharField(max_length=200)
    secteur_activite = models.CharField(max_length=150, blank=True)
    localisation = models.CharField(max_length=200, blank=True)
    date_creation = models.DateField(auto_now_add=True)
    # AJOUT : jour du mois utilisé pour générer le rappel "salaires à payer"
    jour_paiement_salaire = models.PositiveIntegerField(default=28)

    def __str__(self):
        return self.nom


# ============================================================
# EMPLOYÉ
# ============================================================

class Employe(models.Model):
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='employes')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=30, blank=True)
    poste = models.CharField(max_length=100, blank=True)
    salaire = models.FloatField(default=0)
    date_embauche = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.prenom} {self.nom} — {self.poste}"


class EvenementEmploye(models.Model):
    """Promotion ou sanction attribuée à un employé, avec impact précis sur le poste
    et/ou le salaire. Si le salaire est impacté, Employe.salaire est mis à jour
    automatiquement dès la création de l'événement (voir EvenementEmployeViewSet)."""
    TYPE_CHOICES = [('promotion', 'Promotion'), ('sanction', 'Sanction')]
    SOUS_TYPE_SANCTION_CHOICES = [
        ('avertissement', 'Avertissement'),
        ('mise_a_pied', 'Mise à pied'),
    ]
    IMPACT_SALAIRE_CHOICES = [
        ('aucun', 'Aucun changement de salaire'),
        ('augmentation', 'Augmentation de salaire'),
        ('reduction', 'Réduction de salaire'),
    ]

    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name='evenements')
    type_evenement = models.CharField(max_length=20, choices=TYPE_CHOICES)
    # Uniquement pertinent quand type_evenement == 'sanction'
    sous_type_sanction = models.CharField(max_length=20, choices=SOUS_TYPE_SANCTION_CHOICES, blank=True, null=True)
    # Si renseigné (typiquement pour une promotion) : nouveau poste de l'employé,
    # appliqué immédiatement et durablement sur Employe.poste.
    nouveau_poste = models.CharField(max_length=100, blank=True)

    impact_salaire = models.CharField(max_length=20, choices=IMPACT_SALAIRE_CHOICES, default='aucun')
    montant_impact = models.FloatField(default=0)  # toujours positif ; le sens vient de impact_salaire
    # Instantanés pris au moment de la création, pour garder un historique fiable
    # même si le salaire de l'employé est modifié à nouveau plus tard.
    salaire_avant = models.FloatField(null=True, blank=True)
    salaire_apres = models.FloatField(null=True, blank=True)

    description = models.TextField(blank=True)
    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_evenement_display()} — {self.employe}"


# ============================================================
# CLIENT
# ============================================================

class Client(models.Model):
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='clients')
    nom = models.CharField(max_length=150)
    contact = models.CharField(max_length=100, blank=True)
    adresse = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.nom


# ============================================================
# PRODUIT
# ============================================================

class Produit(models.Model):
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='produits')
    nom = models.CharField(max_length=150)
    reference = models.CharField(max_length=100, blank=True)
    prix_vente = models.DecimalField(max_digits=12, decimal_places=2)
    prix_achat = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantite_stock = models.IntegerField(default=0)
    seuil_alerte = models.PositiveIntegerField(default=5)  # AJOUT : seuil configurable par produit

    def __str__(self):
        return f"{self.nom} ({self.reference})"


# ============================================================
# SERVICE (AJOUT — absent du diagramme d'origine)
# ============================================================

class Service(models.Model):
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='services')
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    prix = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return self.nom


# ============================================================
# FACTURE
# ============================================================

class Facture(models.Model):
    DELAI_CHOICES = [
        ('immediat', 'Immédiat'),
        ('7j', '7 jours'),
        ('15j', '15 jours'),
        ('30j', '30 jours'),
    ]
    DELAI_JOURS = {'immediat': 0, '7j': 7, '15j': 15, '30j': 30}

    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('validee', 'Validée'),
        ('annulee', 'Annulée'),
    ]
    STATUT_PAIEMENT_CHOICES = [
        ('en_attente', 'En attente'),
        ('paye', 'Payée'),
    ]

    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='factures')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='factures')
    numero = models.CharField(max_length=50, unique=True)
    date_emission = models.DateField(auto_now_add=True)
    delai = models.CharField(max_length=20, choices=DELAI_CHOICES, default='30j')

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT_CHOICES, default='en_attente')
    # Vrai dès que la validation a déjà provoqué une sortie de stock — sert à savoir si
    # un mouvement inverse doit être généré lors d'une annulation.
    stock_deduit = models.BooleanField(default=False)

    montant_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f"Facture {self.numero} — {self.client.nom}"

    def recalculer_montant_total(self):
        total = sum(ligne.montant_ligne for ligne in self.lignes.all())
        self.montant_total = total
        self.save(update_fields=['montant_total'])

    @property
    def est_en_retard(self):
        """Calculé dynamiquement : facture validée, non payée, échéance dépassée."""
        if self.statut != 'validee' or self.statut_paiement == 'paye':
            return False
        jours = self.DELAI_JOURS.get(self.delai, 30)
        echeance = self.date_emission + timedelta(days=jours)
        return timezone.now().date() > echeance

    @property
    def statut_affiche(self):
        """brouillon / annulee / paye / en_retard / en_attente."""
        if self.statut == 'brouillon':
            return 'brouillon'
        if self.statut == 'annulee':
            return 'annulee'
        if self.statut_paiement == 'paye':
            return 'paye'
        return 'en_retard' if self.est_en_retard else 'en_attente'

    @property
    def peut_etre_modifiee(self):
        return self.statut == 'brouillon'

    @property
    def peut_etre_supprimee(self):
        return self.statut == 'brouillon'

    @property
    def peut_etre_annulee(self):
        return self.statut == 'validee' and self.statut_paiement != 'paye'


class LigneFacture(models.Model):
    """Une ligne référence SOIT un produit SOIT un service (jamais les deux)."""
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT, related_name='lignes_facture', null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='lignes_facture', null=True, blank=True)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    montant_ligne = models.DecimalField(max_digits=14, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.montant_ligne = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    @property
    def designation(self):
        return self.produit.nom if self.produit_id else (self.service.nom if self.service_id else '')

    def __str__(self):
        return f"{self.quantite} x {self.designation}"


# ============================================================
# AUDIT DE VENTE
# ============================================================

class AuditVente(models.Model):
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='audits')
    action = models.CharField(max_length=150)
    date_action = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)
    montant_concerne = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.action} — {self.facture.numero}"


# ============================================================
# PRÉVISION DE STOCK
# ============================================================

class PrevisionStock(models.Model):
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='previsions')
    quantite_prevue = models.FloatField()
    date_generation = models.DateTimeField(auto_now_add=True)
    niveau_confiance = models.FloatField(help_text="Entre 0 et 1, ex: 0.85 pour 85%")
    justification = models.CharField(max_length=255, blank=True)  # AJOUT : explication donnée par l'IA

    def __str__(self):
        return f"Prévision {self.produit.nom} — {self.date_generation.date()}"


# ============================================================
# NOTIFICATION (AJOUT)
# ============================================================

class Notification(models.Model):
    TYPE_CHOICES = [
        ('stock_critique', 'Stock critique'),
        ('facture_retard', 'Facture en retard'),
        ('promotion', 'Promotion employé'),
        ('sanction', 'Sanction employé'),
        ('salaire_a_payer', 'Salaires à payer'),
    ]

    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='notifications')
    type_notification = models.CharField(max_length=30, choices=TYPE_CHOICES)
    message = models.CharField(max_length=255)
    lien = models.CharField(max_length=200, blank=True)  # route frontend associée, ex: /produits
    lue = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return self.message


# ============================================================
# ASSISTANT IA — historique des conversations (AJOUT)
# ============================================================

class ConversationIA(models.Model):
    """Une conversation avec l'assistant IA, propre à un utilisateur (entrepreneur
    ou administrateur) — indépendante d'une entreprise précise."""
    utilisateur = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='conversations_ia')
    titre = models.CharField(max_length=150, default='Nouvelle conversation')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_maj']

    def __str__(self):
        return self.titre


class MessageIA(models.Model):
    ROLE_CHOICES = [('user', 'Utilisateur'), ('assistant', 'Assistant')]

    conversation = models.ForeignKey(ConversationIA, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    contenu = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_creation']

    def __str__(self):
        return f"[{self.role}] {self.contenu[:50]}"
