from rest_framework import serializers
from core.models import (
    CustomUser, Entreprise, Employe, EvenementEmploye, Client, Produit, Service,
    Facture, LigneFacture, AuditVente, PrevisionStock, Notification,
    ConversationIA, MessageIA,
)


# --- AUTH ---

class RegisterSerializer(serializers.Serializer):
    nom_entreprise = serializers.CharField()
    secteur_activite = serializers.CharField(required=False, allow_blank=True)
    localisation = serializers.CharField(required=False, allow_blank=True)

    nom = serializers.CharField()
    prenom = serializers.CharField()
    email = serializers.EmailField()
    numrcc = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Les mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        nom = validated_data.pop('nom')
        prenom = validated_data.pop('prenom')
        numrcc = validated_data.pop('numrcc', '')
        nom_entreprise = validated_data.pop('nom_entreprise')
        secteur_activite = validated_data.pop('secteur_activite', '')
        localisation = validated_data.pop('localisation', '')

        user = CustomUser.objects.create_user(
            email=email, password=password, nom=nom, prenom=prenom,
            role='entrepreneur', numrcc=numrcc
        )
        Entreprise.objects.create(
            entrepreneur=user, nom=nom_entreprise,
            secteur_activite=secteur_activite, localisation=localisation
        )
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'nom', 'prenom', 'role', 'numrcc', 'is_active', 'date_joined', 'password']
        read_only_fields = ['date_joined']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        user.set_password(password or CustomUser.objects.make_random_password())
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    """Profil de l'utilisateur connecté (GET/PUT /auth/me/)."""
    nb_entreprises = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'nom', 'prenom', 'role', 'numrcc', 'is_superuser', 'nb_entreprises']
        read_only_fields = ['email', 'role']  # l'email n'est pas modifiable ici (identifiant de connexion)

    def get_nb_entreprises(self, obj):
        if obj.role != 'entrepreneur':
            return 0
        return obj.entreprises.count()


class ChangePasswordSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    def validate_ancien_mot_de_passe(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value


# --- ENTREPRISE ---

class EntrepriseSerializer(serializers.ModelSerializer):
    nb_employes = serializers.SerializerMethodField()

    class Meta:
        model = Entreprise
        fields = '__all__'
        read_only_fields = ['entrepreneur']

    def get_nb_employes(self, obj):
        if hasattr(obj, 'nb_employes'):
            return obj.nb_employes
        return obj.employes.count()


# --- EMPLOYÉ ---

class EvenementEmployeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvenementEmploye
        fields = [
            'id', 'employe', 'type_evenement', 'sous_type_sanction', 'nouveau_poste',
            'impact_salaire', 'montant_impact', 'salaire_avant', 'salaire_apres',
            'description', 'date_debut', 'date_fin', 'date_creation',
        ]
        read_only_fields = ['employe', 'salaire_avant', 'salaire_apres', 'date_creation']

    def validate(self, data):
        if data.get('type_evenement') == 'sanction' and not data.get('sous_type_sanction'):
            raise serializers.ValidationError(
                {"sous_type_sanction": "Précise le type de sanction (avertissement ou mise à pied)."}
            )
        if data.get('type_evenement') == 'promotion' and data.get('sous_type_sanction'):
            raise serializers.ValidationError(
                {"sous_type_sanction": "Ce champ ne s'applique qu'aux sanctions."}
            )
        if data.get('impact_salaire') in ('augmentation', 'reduction') and not data.get('montant_impact'):
            raise serializers.ValidationError(
                {"montant_impact": "Indique le montant de l'ajustement de salaire."}
            )
        return data


class EmployeSerializer(serializers.ModelSerializer):
    evenements = EvenementEmployeSerializer(many=True, read_only=True)

    class Meta:
        model = Employe
        fields = ['id', 'entreprise', 'nom', 'prenom', 'telephone', 'poste', 'salaire', 'date_embauche', 'evenements']
        read_only_fields = ['entreprise']


# --- CLIENT ---

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ['entreprise']


# --- PRODUIT / SERVICE ---

class ProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = '__all__'
        read_only_fields = ['entreprise']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ['entreprise']


# --- FACTURE (+ lignes imbriquées, produit OU service) ---

class LigneFactureSerializer(serializers.ModelSerializer):
    designation = serializers.CharField(read_only=True)

    class Meta:
        model = LigneFacture
        fields = ['id', 'produit', 'service', 'designation', 'quantite', 'prix_unitaire', 'montant_ligne']
        read_only_fields = ['montant_ligne']

    def validate(self, data):
        produit = data.get('produit')
        service = data.get('service')
        if not produit and not service:
            raise serializers.ValidationError("Chaque ligne doit référencer un produit ou un service.")
        if produit and service:
            raise serializers.ValidationError("Une ligne ne peut pas référencer à la fois un produit et un service.")
        return data


class FactureSerializer(serializers.ModelSerializer):
    lignes = LigneFactureSerializer(many=True)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    statut_affiche = serializers.CharField(read_only=True)
    peut_etre_modifiee = serializers.BooleanField(read_only=True)
    peut_etre_supprimee = serializers.BooleanField(read_only=True)
    peut_etre_annulee = serializers.BooleanField(read_only=True)

    class Meta:
        model = Facture
        fields = ['id', 'numero', 'client', 'client_nom', 'date_emission', 'delai',
                   'statut', 'statut_paiement', 'statut_affiche', 'montant_total', 'lignes',
                   'peut_etre_modifiee', 'peut_etre_supprimee', 'peut_etre_annulee']
        read_only_fields = ['numero', 'statut', 'statut_paiement', 'montant_total', 'date_emission']

    def validate_lignes(self, lignes):
        if not lignes:
            raise serializers.ValidationError("Au moins une ligne (produit ou service) est requise.")
        return lignes

    def create(self, validated_data):
        """Crée toujours une facture en BROUILLON. Aucun impact sur le stock à ce stade :
        le stock n'est décrémenté qu'à la validation (voir FactureViewSet.valider)."""
        import random
        from django.utils import timezone

        lignes_data = validated_data.pop('lignes')
        entreprise = self.context['entreprise']

        numero = f"FAC-{timezone.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        while Facture.objects.filter(numero=numero).exists():
            numero = f"FAC-{timezone.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

        facture = Facture.objects.create(entreprise=entreprise, numero=numero, statut='brouillon', **validated_data)

        for ligne in lignes_data:
            LigneFacture.objects.create(facture=facture, **ligne)

        facture.recalculer_montant_total()
        return facture

    def update(self, instance, validated_data):
        """Modification des lignes/client/délai — réservée aux brouillons (la vue
        vérifie déjà peut_etre_modifiee, ceci est une seconde barrière)."""
        if not instance.peut_etre_modifiee:
            raise serializers.ValidationError("Seules les factures en brouillon peuvent être modifiées.")

        lignes_data = validated_data.pop('lignes', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lignes_data is not None:
            instance.lignes.all().delete()
            for ligne in lignes_data:
                LigneFacture.objects.create(facture=instance, **ligne)
            instance.recalculer_montant_total()

        return instance


# --- AUDIT DE VENTE ---

class AuditVenteSerializer(serializers.ModelSerializer):
    facture_numero = serializers.CharField(source='facture.numero', read_only=True)

    class Meta:
        model = AuditVente
        fields = ['id', 'facture', 'facture_numero', 'action', 'date_action', 'details', 'montant_concerne']
        read_only_fields = fields


# --- PRÉVISION DE STOCK ---

class PrevisionStockSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model = PrevisionStock
        fields = ['id', 'produit', 'produit_nom', 'quantite_prevue', 'date_generation', 'niveau_confiance', 'justification']
        read_only_fields = ['date_generation']


# --- NOTIFICATION ---

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type_notification', 'message', 'lien', 'lue', 'date_creation']
        read_only_fields = ['type_notification', 'message', 'lien', 'date_creation']


# --- ASSISTANT IA ---

class MessageIASerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageIA
        fields = ['id', 'role', 'contenu', 'date_creation']
        read_only_fields = fields


class ConversationIASerializer(serializers.ModelSerializer):
    """Utilisée pour la liste (sans messages, plus léger)."""
    class Meta:
        model = ConversationIA
        fields = ['id', 'titre', 'date_creation', 'date_maj']
        read_only_fields = fields


class ConversationIADetailSerializer(ConversationIASerializer):
    """Utilisée pour le détail : inclut tous les messages."""
    messages = MessageIASerializer(many=True, read_only=True)

    class Meta(ConversationIASerializer.Meta):
        fields = ConversationIASerializer.Meta.fields + ['messages']
