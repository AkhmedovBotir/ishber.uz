export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface MaterialImage {
  id?: string;
  url: string;
  caption?: string;
}

export interface LearningMaterial {
  _id: string;
  vacancyId?: string;
  title: string;
  order: number;
  descriptionDelta?: {
    ops?: Array<{
      insert?: string | Record<string, unknown>;
      attributes?: Record<string, unknown>;
    }>;
  };
  videoType: 'url' | 'file' | 'none';
  videoUrl?: string;
  videoFile?: string;
  images: MaterialImage[];
  quiz: QuizQuestion[];
  createdAt?: string;
}

export interface EnrolledVacancy {
  vacancyId: string;
  submissionId: string;
  submissionNumber?: number | null;
  status: string;
  title: string;
  department?: string;
  location?: string;
  promotedAt?: string;
  totalMaterials: number;
}

export interface CandidateProfile {
  isCandidate: boolean;
  foundApplication: boolean;
  phone: string;
  fullName: string;
  needsName: boolean;
  vacancies: EnrolledVacancy[];
  message?: string;
}

export interface CourseData {
  vacancy: {
    _id: string;
    title: string;
    department?: string;
    location?: string;
  };
  materials: LearningMaterial[];
}

export interface FinalExamQuestion {
  id: string;
  type: 'radio' | 'checkbox' | 'text';
  question: string;
  options?: string[];
}

export interface FinalExamData {
  _id?: string;
  vacancyId: string;
  vacancyTitle?: string;
  title: string;
  description?: string;
  passingScore: number;
  questions: FinalExamQuestion[];
  isPublished?: boolean;
  exists: boolean;
}

export interface FinalExamCandidateStatus {
  hasSubmitted: boolean;
  status: 'submitted' | 'accepted' | 'rejected' | null;
  autoScore?: number;
  adminNote?: string;
  submittedAt?: string;
  reviewedAt?: string;
}
