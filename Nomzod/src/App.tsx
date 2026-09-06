import { useState, useMemo } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  matchPath,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { Navbar } from './components/Navbar';
import { PhoneAuthModal } from './components/PhoneAuthModal';
import { NameCompletionModal } from './components/NameCompletionModal';
import { VacancySwitcherModal } from './components/VacancySwitcherModal';
import { VacanciesPage } from './pages/VacanciesPage';
import { CoursePage } from './pages/CoursePage';
import { ExamPage } from './pages/ExamPage';
import { MyCertificatesPage } from './pages/MyCertificatesPage';
import { PublicVerifyCertificatePage } from './pages/PublicVerifyCertificatePage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { phone, profile, loading, checkPhone, saveName, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [vacancyModalOpen, setVacancyModalOpen] = useState<boolean>(false);

  // Check if current route is public verification
  const isPublicVerifyRoute = location.pathname.startsWith('/verify/');

  // Active vacancy derived from URL route /courses/:vacancyId
  const courseMatch = matchPath('/courses/:vacancyId/*', location.pathname);
  const activeVacancyId = courseMatch?.params?.vacancyId || null;

  const selectedVacancy = useMemo(() => {
    if (!activeVacancyId || !profile?.vacancies) return null;
    return profile.vacancies.find((v) => v.vacancyId === activeVacancyId) || null;
  }, [activeVacancyId, profile?.vacancies]);

  // If public verification route, render directly without forcing auth modal
  if (isPublicVerifyRoute) {
    return (
      <Routes>
        <Route path="/verify/:certificateNumber" element={<PublicVerifyCertificatePage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8fafc] text-gray-900 selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        profile={profile}
        selectedVacancy={selectedVacancy}
        onGoToDashboard={() => navigate('/')}
        onGoToCertificates={() => navigate('/certificates')}
        onOpenVacancyModal={() => setVacancyModalOpen(true)}
        onLogout={logout}
      />

      {/* 1. Phone Authentication Modal (if not logged in) */}
      {!phone && (
        <PhoneAuthModal
          onCheckPhone={async (p) => {
            await checkPhone(p);
          }}
          initialPhone=""
        />
      )}

      {/* 2. Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="mt-4 text-sm font-semibold text-gray-600">
            Nomzodlik ma’lumotlari tekshirilmoqda...
          </p>
        </div>
      )}

      {/* 3. Name Completion Modal (if logged in as candidate but name missing) */}
      {!loading && profile && profile.isCandidate && profile.needsName && (
        <NameCompletionModal
          onSaveName={saveName}
          currentPhone={profile.phone}
        />
      )}

      {/* 4. Routes Area */}
      {!loading && profile && (
        <Routes>
          <Route path="/" element={<VacanciesPage />} />
          <Route path="/vacancies" element={<VacanciesPage />} />
          <Route path="/courses/:vacancyId" element={<CoursePage />} />
          <Route path="/courses/:vacancyId/exam" element={<ExamPage />} />
          <Route path="/certificates" element={<MyCertificatesPage />} />
          <Route path="/verify/:certificateNumber" element={<PublicVerifyCertificatePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      {/* 5. Multi-Vacancy Switcher Modal */}
      {vacancyModalOpen && profile && profile.vacancies && profile.vacancies.length > 0 && (
        <VacancySwitcherModal
          vacancies={profile.vacancies}
          activeVacancyId={selectedVacancy?.vacancyId || ''}
          onSelect={(v) => {
            setVacancyModalOpen(false);
            navigate(`/courses/${v.vacancyId}`);
          }}
          onClose={() => setVacancyModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}
