interface QuestionEvaluation {
  question: string;
  candidateAnswer: string;
  score: number;
  modelAnswer: string;
  suggestion: string;
}

export interface SpeechMetrics {
  wpm: number;
  fillerWordCount: number;
  fillerWordsFound: string[];
  clarityScore: number;
}

export interface SkillRadar {
  technical: number;
  problemSolving: number;
  communication: number;
  architecture: number;
  systemDesign: number;
}

interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  readinessScore?: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  questionEvaluations?: QuestionEvaluation[];
  speechMetrics?: SpeechMetrics;
  skillRadar?: SkillRadar;
  createdAt: string;
}

export type InterviewerPersonaId = "supportive" | "faang" | "startup";

export interface InterviewerPersona {
  id: InterviewerPersonaId;
  name: string;
  title: string;
  description: string;
  avatar: string;
  badge: string;
  systemPromptModifier: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  personaId?: InterviewerPersonaId;
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}
