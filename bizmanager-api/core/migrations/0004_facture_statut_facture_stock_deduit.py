from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_facture_statut_paiement_produit_seuil_alerte_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='facture',
            name='statut',
            field=models.CharField(
                choices=[('brouillon', 'Brouillon'), ('validee', 'Validée'), ('annulee', 'Annulée')],
                default='brouillon',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='facture',
            name='stock_deduit',
            field=models.BooleanField(default=False),
        ),
    ]
