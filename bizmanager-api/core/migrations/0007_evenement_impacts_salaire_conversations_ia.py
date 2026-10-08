import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0006_previsionstock_justification'),
    ]

    operations = [
        migrations.AddField(
            model_name='entreprise',
            name='jour_paiement_salaire',
            field=models.PositiveIntegerField(default=28),
        ),
        migrations.AddField(
            model_name='evenementemploye',
            name='sous_type_sanction',
            field=models.CharField(
                blank=True, null=True, max_length=20,
                choices=[('avertissement', 'Avertissement'), ('mise_a_pied', 'Mise à pied')],
            ),
        ),
        migrations.AddField(
            model_name='evenementemploye',
            name='nouveau_poste',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='evenementemploye',
            name='impact_salaire',
            field=models.CharField(
                max_length=20, default='aucun',
                choices=[('aucun', 'Aucun changement de salaire'),
                          ('augmentation', 'Augmentation de salaire'),
                          ('reduction', 'Réduction de salaire')],
            ),
        ),
        migrations.AddField(
            model_name='evenementemploye',
            name='montant_impact',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='evenementemploye',
            name='salaire_avant',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='evenementemploye',
            name='salaire_apres',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='type_notification',
            field=models.CharField(
                max_length=30,
                choices=[('stock_critique', 'Stock critique'),
                          ('facture_retard', 'Facture en retard'),
                          ('promotion', 'Promotion employé'),
                          ('sanction', 'Sanction employé'),
                          ('salaire_a_payer', 'Salaires à payer')],
            ),
        ),
        migrations.CreateModel(
            name='ConversationIA',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(default='Nouvelle conversation', max_length=150)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_maj', models.DateTimeField(auto_now=True)),
                ('utilisateur', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='conversations_ia', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-date_maj']},
        ),
        migrations.CreateModel(
            name='MessageIA',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('user', 'Utilisateur'), ('assistant', 'Assistant')], max_length=20)),
                ('contenu', models.TextField()),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('conversation', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages', to='core.conversationia',
                )),
            ],
            options={'ordering': ['date_creation']},
        ),
    ]
