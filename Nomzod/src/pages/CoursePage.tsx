import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVacancyMaterials } from '../services/api';
import { CoursePlayer } from '../components/CoursePlayer';
import type { CourseData } from '../types';
import { Loader2, ArrowLeft } from 'lucide-react';

export const CoursePage: React.FC = () => {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vacancyId) return;

    setLoading(true);
    setError(null);
    getVacancyMaterials(vacancyId)
      .then((data) => {
        setCourseData(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.message || 'Dars materiallarini yuklashda xatolik yuz berdi');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [vacancyId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-xs font-semibold text-gray-500">
          O‘quv materiallari yuklanmoqda...
        </p>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm w-full space-y-4">
          <p className="text-sm font-semibold text-gray-800">
            {error || 'Dars materiallari topilmadi.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Vakansiyalarga qaytish</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <CoursePlayer
      courseData={courseData}
      candidateName={profile?.fullName || 'Nomzod'}
      onBackToDashboard={() => navigate('/')}
      onOpenFinalExam={() => navigate(`/courses/${vacancyId}/exam`)}
    />
  );
};
