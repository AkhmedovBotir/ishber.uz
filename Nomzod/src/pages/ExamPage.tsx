import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FinalExamPlayer } from '../components/FinalExamPlayer';

export const ExamPage: React.FC = () => {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const { profile, phone } = useAuth();
  const navigate = useNavigate();

  if (!vacancyId) return null;

  const enrolledVacancy = profile?.vacancies?.find((v) => v.vacancyId === vacancyId);
  const vacancyTitle = enrolledVacancy?.title || 'Vakansiya';

  return (
    <FinalExamPlayer
      vacancyId={vacancyId}
      vacancyTitle={vacancyTitle}
      phone={profile?.phone || phone}
      candidateName={profile?.fullName || 'Nomzod'}
      onBackToCourse={() => navigate(`/courses/${vacancyId}`)}
    />
  );
};
