"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from api.views import (
    RegisterView,
    profile_view,
    physical_profile_view,
    fitness_profile_view,
    dietary_profile_view,
    user_detail_view,
    profile_setup_view,
    logout_view,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
)

from llm.views import (
    recommendations_view,
    search_content_view,
    upsert_content_view,
    delete_content_view,
    fitness_content_search,
    fitness_content_management,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # NOTE: USER AUTH ENDPOINTS
    path("api/register/", RegisterView, name="register"),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("api/logout/", logout_view, name="logout"),
    # NOTE: USER PROFILE ENDPIONTS
    path("api/profile/", profile_view, name="profile"),
    path("api/profile/setup/", profile_setup_view, name="profile_setup"),
    path("api/profile/physical/", physical_profile_view, name="physical_profile"),
    path("api/profile/fitness/", fitness_profile_view, name="fitness_profile"),
    path("api/profile/dietary/", dietary_profile_view, name="dietary_profile"),
    path("api/profile/detail/", user_detail_view, name="user_detail"),
    # NOTE: RECOMMENDATION ENDPOINTS
    path("api/recommendations/", recommendations_view, name="recommendations"),
    # NOTE: FITNESS CONTENT ENDPOINTS
    path(
        "api/fitness-content/search/",
        fitness_content_search,
        name="fitness_content_search",
    ),
    path(
        "api/fitness-content/", fitness_content_management, name="fitness_content_list"
    ),
    path(
        "api/fitness-content/<int:content_id>/",
        fitness_content_management,
        name="fitness_content_detail",
    ),
    path("api/vector/search/", search_content_view, name="vector_search"),
    path("api/vector/upsert/", upsert_content_view, name="vector_upsert"),
    path(
        "api/vector/delete/<str:embedding_id>/",
        delete_content_view,
        name="vector_delete",
    ),
    path("api/vector/delete/", delete_content_view, name="vector_delete_by_body"),
]
