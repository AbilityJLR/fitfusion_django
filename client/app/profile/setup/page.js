'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSetupForm from '../../components/ProfileSetupForm';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import { getProfileSetupData } from '../../utils/profile';
import styles from './Setup.module.css'

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

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmitSuccess = () => {
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <div style={{ marginTop: "1rem" }}>
          <h1 className='gradient-text'>Setup Your Profile</h1>
          <ProfileSetupForm
            onSubmitStart={() => setSubmitting(true)}
            onSubmitEnd={() => setSubmitting(false)}
            onSubmitSuccess={handleSubmitSuccess}
            submitting={submitting}
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  );
}
