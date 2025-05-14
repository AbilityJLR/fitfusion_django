'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSetupForm from '../../components/ProfileSetupForm';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import { getProfileSetupData } from '../../utils/profile';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated || isLoading) return;
      
      setDataLoading(true);
      
      try {
        const profileData = await getProfileSetupData();
        setInitialData(profileData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setInitialData({
          user_profile: {},
          physical_profile: {},
          fitness_profile: {},
          dietary_profile: {}
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, isLoading]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmitSuccess = () => {
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-10">Setup Your Profile</h1>
        <ProfileSetupForm 
          onSubmitStart={() => setSubmitting(true)}
          onSubmitEnd={() => setSubmitting(false)}
          onSubmitSuccess={handleSubmitSuccess}
          submitting={submitting}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
