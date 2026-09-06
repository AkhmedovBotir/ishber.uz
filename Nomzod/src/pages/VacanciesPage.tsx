import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VacanciesDashboard } from '../components/VacanciesDashboard';
import { EmptyState } from '../components/EmptyState';
import type { EnrolledVacancy } from '../types';

export const VacanciesPage: React.FC = () => {
  const { profile, checkPhone, logout } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  if (!profile.isCandidate) {
    return (
      <EmptyState
        profile={profile}
        onRefresh={async () => {
          await checkPhone(profile.phone);
        }}
        onChangePhone={logout}
      />
    );
  }

  const handleSelectVacancy = (vacancy: EnrolledVacancy) => {
    navigate(`/courses/${vacancy.vacancyId}`);
  };

  return (
    <VacanciesDashboard
      profile={profile}
      onSelectVacancy={handleSelectVacancy}
    />
  );
};
