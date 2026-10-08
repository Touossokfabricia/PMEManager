from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from core.serializers import RegisterSerializer, UserSerializer, ChangePasswordSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({"detail": "Veuillez remplir tous les champs."}, status=400)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({"detail": "Email ou mot de passe incorrect."}, status=401)

    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"detail": "Inscription réussie."}, status=201)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """GererProfil : consulter / modifier ses informations personnelles (nom, prénom, numrcc)."""
    if request.method == 'PUT':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data['nouveau_mot_de_passe'])
    request.user.save()
    return Response({"detail": "Mot de passe modifié avec succès."})
