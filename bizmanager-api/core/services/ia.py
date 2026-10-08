"""
Service centralisé d'appel à l'IA (Google Gemini, gratuit).
Utilisé à la fois par le chatbot (core/views/assistant.py) et par la
prévision dynamique de stock (core/views/tenant.py).

Documentation de l'endpoint compatible OpenAI utilisé ici :
https://ai.google.dev/gemini-api/docs/openai
"""
import time
import requests
from decouple import config

GEMINI_API_KEY = config('GEMINI_API_KEY', default='')
GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
GEMINI_MODEL = 'gemini-3.8-flash'


class IAIndisponible(Exception):
    """Levée quand la clé est absente, ou que l'appel à Gemini échoue."""
    pass


def appeler_gemini(messages, temperature=0.4, tentatives=3):
    """
    messages : liste au format OpenAI [{"role": "system"|"user"|"assistant", "content": "..."}]
    Retourne le texte de la réponse (str).

    Les serveurs Gemini renvoient parfois un 503 (surcharge temporaire) sur l'offre
    gratuite : on retente automatiquement quelques fois avant d'abandonner.
    """
    if not GEMINI_API_KEY:
        raise IAIndisponible(
            "Clé GEMINI_API_KEY absente du .env. Ajoute-la puis redémarre le serveur Django."
        )

    derniere_erreur = None
    for essai in range(tentatives):
        try:
            response = requests.post(
                GEMINI_URL,
                headers={
                    'Authorization': f'Bearer {GEMINI_API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': GEMINI_MODEL,
                    'messages': messages,
                    'temperature': temperature,
                },
                timeout=25,
            )
            if response.status_code in (503, 429) and essai < tentatives - 1:
                time.sleep(1.5 * (essai + 1))  # backoff progressif : 1.5s, 3s...
                continue
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content']
        except requests.RequestException as e:
            derniere_erreur = e
            if essai < tentatives - 1:
                time.sleep(1.5 * (essai + 1))
                continue
        except (KeyError, IndexError):
            raise IAIndisponible("Réponse inattendue de l'IA.")

    raise IAIndisponible(
        f"L'assistant IA est momentanément surchargé, réessaie dans quelques instants ({derniere_erreur})."
    )
