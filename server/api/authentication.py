from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    
    def authenticate(self, request):
        
        cookie_name = getattr(settings, 'SIMPLE_JWT', {}).get('AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)
        
        if raw_token is None:
            
            return super().authenticate(request)
            
        
        validated_token = self.get_validated_token(raw_token)
        
        
        user = self.get_user(validated_token)
        
        return user, validated_token 