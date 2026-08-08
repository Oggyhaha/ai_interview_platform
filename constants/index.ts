import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

export const INTERVIEWER_PERSONAS = [
  {
    id: "supportive",
    name: "Sarah Jenkins",
    title: "Supportive Tech Mentor",
    description: "Encouraging, patient, and gives gentle hints when you stumble.",
    avatar: "/ai-avatar.png",
    badge: "Mentorship Mode",
    systemPromptModifier: `STYLE & PERSONA: You are a warm, supportive mentor. Be encouraging, patient, and friendly. If the candidate hesitates or gives a short response, give a small encouraging hint or prompt. Keep responses friendly and concise.`,
  },
  {
    id: "faang",
    name: "Alex Vance",
    title: "FAANG Staff Architect",
    description: "Strict, highly technical, probes edge cases, performance, & scale.",
    avatar: "/ai-avatar.png",
    badge: "FAANG Probing",
    systemPromptModifier: `STYLE & PERSONA: You are a senior Staff Architect at a top tech company (FAANG style). Be professional, highly technical, and probing. Ask about edge cases, scaling limits, trade-offs, and design choices. Maintain high standards while remaining professional and concise.`,
  },
  {
    id: "startup",
    name: "Marcus Chen",
    title: "Startup Founder & CTO",
    description: "Rapid-fire, high energy, evaluates speed, agility, & execution.",
    avatar: "/ai-avatar.png",
    badge: "Fast-Paced Startup",
    systemPromptModifier: `STYLE & PERSONA: You are a fast-moving YC startup founder & CTO. Be energetic, direct, and focused on execution speed, adaptability, and pragmatic problem solving. Keep responses quick, energetic, and concise.`,
  },
] as const;

export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Here are the questions you MUST ask during this interview:
{{questions}}

CRITICAL INSTRUCTIONS:
1. The user will confirm they are ready. As soon as they do, YOU MUST IMMEDIATELY ASK THE FIRST QUESTION from the list above.
2. Ask exactly ONE question at a time.
3. Listen to the user's response, acknowledge it briefly (e.g., "Great", "I see", "Interesting"), and then immediately ask the NEXT question.
4. Never ask multiple questions at once.
5. Do not skip any questions.
6. Once you have asked all the questions and the user has answered the final one, you must conclude the interview by saying exactly: "Thank you for your time. That concludes our interview. Have a great day!"

STYLE:
- Be professional, polite, and welcoming.
- Keep your responses short and conversational. This is a voice call, so avoid long rambling paragraphs.`,
      },
    ],
  },
};

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.array(
    z.object({
      name: z.string().describe("Category name. Must be one of: Communication Skills, Technical Knowledge, Problem Solving, Cultural Fit, Confidence and Clarity"),
      score: z.number(),
      comment: z.string(),
    })
  ).describe("Array of exactly 5 category scores"),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
  questionEvaluations: z.array(
    z.object({
      question: z.string().describe("The interview question that was asked"),
      candidateAnswer: z.string().describe("Brief summary of what the candidate answered"),
      score: z.number().describe("Score for this specific answer out of 100"),
      modelAnswer: z.string().describe("Ideal model answer a senior engineer/candidate would provide"),
      suggestion: z.string().describe("Specific tip to improve this exact answer"),
    })
  ).optional().describe("Question-by-question model answer breakdown"),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
  {
    id: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    level: "Junior",
    questions: ["What is React?"],
    finalized: false,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "user1",
    role: "Full Stack Developer",
    type: "Mixed",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    level: "Senior",
    questions: ["What is Node.js?"],
    finalized: false,
    createdAt: "2024-03-14T15:30:00Z",
  },
];