from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_seed_demo_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='previsionstock',
            name='justification',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
