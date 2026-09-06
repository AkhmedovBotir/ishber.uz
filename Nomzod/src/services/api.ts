import type {
  CandidateProfile,
  CourseData,
  FinalExamData,
  FinalExamCandidateStatus,
} from '../types';

const BASE_URL = 'https://api.ishber.uz/api/public/candidate';
export const SERVER_ORIGIN = 'https://api.ishber.uz';

export function resolveMediaUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_ORIGIN}${cleanPath}`;
}

export async function checkCandidatePhone(phone: string): Promise<CandidateProfile> {
  const res = await fetch(`${BASE_URL}/check-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Telefon raqamni tekshirishda xatolik yuz berdi');
  }

  return res.json();
}

export async function updateCandidateName(phone: string, fullName: string): Promise<CandidateProfile> {
  const res = await fetch(`${BASE_URL}/update-name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, fullName }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Ism-familiyani saqlashda xatolik yuz berdi');
  }

  return res.json();
}

export async function getVacancyMaterials(vacancyId: string): Promise<CourseData> {
  const res = await fetch(`${BASE_URL}/vacancies/${vacancyId}/materials`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Dars materiallarini yuklashda xatolik yuz berdi');
  }

  return res.json();
}

export async function getCandidateFinalExam(vacancyId: string): Promise<FinalExamData> {
  const res = await fetch(`${BASE_URL}/vacancies/${vacancyId}/final-exam`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Yakuniy testni yuklashda xatolik yuz berdi');
  }

  return res.json();
}

export async function submitCandidateFinalExam(
  vacancyId: string,
  payload: {
    phone: string;
    candidateName: string;
    answers: Array<{
      questionId: string;
      selectedOption?: number;
      selectedOptions?: number[];
      textValue?: string;
    }>;
  }
): Promise<{ success: boolean; submissionId: string; status: string; autoScore: number; message: string }> {
  const res = await fetch(`${BASE_URL}/vacancies/${vacancyId}/final-exam/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Yakuniy testni topshirishda xatolik yuz berdi');
  }

  return res.json();
}

export async function getCandidateFinalExamStatus(
  vacancyId: string,
  phone: string
): Promise<FinalExamCandidateStatus> {
  const res = await fetch(`${BASE_URL}/vacancies/${vacancyId}/final-exam/status?phone=${encodeURIComponent(phone)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Yakuniy test holatini yuklashda xatolik');
  }

  return res.json();
}

export async function getCandidateCertificates(phone: string): Promise<any[]> {
  const res = await fetch(`${SERVER_ORIGIN}/api/public/candidate/certificates?phone=${encodeURIComponent(phone)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Sertifikatlarni yuklashda xatolik');
  }

  const json = await res.json();
  return json.data || [];
}

export async function verifyCertificate(certificateNumber: string): Promise<{
  isValid: boolean;
  status?: string;
  message?: string;
  revokeReason?: string;
  certificate?: any;
}> {
  const res = await fetch(`${SERVER_ORIGIN}/api/public/certificates/verify/${encodeURIComponent(certificateNumber)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Sertifikatni tekshirishda xatolik');
  }

  const json = await res.json();
  return json.data || { isValid: false };
}

