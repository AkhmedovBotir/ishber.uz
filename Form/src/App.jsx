import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import VacancyApplyPage from './pages/VacancyApplyPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/vacancies/:vacancyId/apply" element={<VacancyApplyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
