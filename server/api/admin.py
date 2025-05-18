from django.contrib import admin
from .models import (
    FitnessProfile,
    PhysicalProfile,
    User,
    DietaryProfile,
    FitnessContent,
)

admin.site.register(User)
admin.site.register(PhysicalProfile)
admin.site.register(FitnessProfile)
admin.site.register(DietaryProfile)
admin.site.register(FitnessContent)
