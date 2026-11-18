import type { ObjectId } from "mongodb";
import type { Skill } from "@/data/skills";

export const LEVELS = ["fresher", "junior"] as const;
export type Level = (typeof LEVELS)[number];

export const QUESTION_TYPES = ["mcq", "code", "text"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const MEMBER_STATUSES = ["invited", "in_progress", "submitted"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  invited: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
};

export interface McqOption {
  id: string;
  text: string;
}

export interface TestCase {
  args: unknown[];
  expected: unknown;
  hidden: boolean;
}

interface QuestionBase {
  title: string;
  prompt: string;
  level: Level;
  skill: Skill;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface McqQuestionDoc extends QuestionBase {
  _id?: ObjectId;
  type: "mcq";
  options: McqOption[];
  correctOptionIds: string[];
}

export interface CodeQuestionDoc extends QuestionBase {
  _id?: ObjectId;
  type: "code";
  functionName: string;
  starterCode: string;
  testCases: TestCase[];
}

export interface TextQuestionDoc extends QuestionBase {
  _id?: ObjectId;
  type: "text";
  markingGuide: string;
}

export type QuestionDoc = McqQuestionDoc | CodeQuestionDoc | TextQuestionDoc;

export const TEXT_ANSWER_MAX_LENGTH = 10000;

export interface TestDoc {
  _id?: ObjectId;
  title: string;
  description: string;
  durationMinutes: number;
  questionIds: ObjectId[];
  shuffleQuestions: boolean;
  orderMode?: OrderMode;
  shuffleOptions?: boolean;
  requireFullscreen?: boolean;
  links?: TestLink[];
  createdAt: Date;
  updatedAt: Date;
}

export const ORDER_MODES = ["fixed", "sections", "all"] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

export interface TestSettings {
  orderMode: OrderMode;
  shuffleOptions: boolean;
  requireFullscreen: boolean;
}

export function resolveTestSettings(test: Pick<TestDoc, "shuffleQuestions" | "orderMode" | "shuffleOptions" | "requireFullscreen">): TestSettings {
  return {
    orderMode: test.orderMode ?? (test.shuffleQuestions ? "all" : "fixed"),
    shuffleOptions: test.shuffleOptions ?? true,
    requireFullscreen: test.requireFullscreen ?? true,
  };
}

export const LINK_AUDIENCES = ["all", "roles", "users"] as const;
export type LinkAudience = (typeof LINK_AUDIENCES)[number];

export interface TestLink {
  code: string;
  label: string;
  audience: LinkAudience;
  roles: string[];
  userIds: ObjectId[];
  enabled: boolean;
  createdAt: Date;
  lastEmailedAt?: Date;
  lastEmailedCount?: number;
}

export interface OtpDoc {
  _id?: ObjectId;
  userId: ObjectId;
  testId: ObjectId;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface CaseResult {
  passed: boolean;
  hidden: boolean;
  error?: string;
}

export interface AnswerRecord {
  selectedOptionIds?: string[];
  code?: string;
  text?: string;
  autoScore?: number;
  manualScore?: number;
  caseResults?: CaseResult[];
  reviewerNote?: string;
  savedAt: Date;
}

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  employeeId: string;
  employeeIdKey: string;
  role: string;
  email: string;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberDoc {
  _id?: ObjectId;
  userId?: ObjectId;
  name: string;
  email: string;
  employeeId?: string;
  role?: string;
  skills?: string[];
  testId: ObjectId;
  token: string;
  status: MemberStatus;
  questionOrder: ObjectId[];
  answers: Record<string, AnswerRecord>;
  tabSwitches: number;
  fullscreenExits?: number;
  fullscreenUnsupported?: boolean;
  deviceConflicts?: number;
  lastConflictSession?: string;
  activeSession?: { id: string; lastSeen: Date };
  startedAt?: Date;
  submittedAt?: Date;
  codeGradedAt?: Date;
  createdAt: Date;
}

export interface PublicMcqQuestion {
  id: string;
  type: "mcq";
  title: string;
  prompt: string;
  points: number;
  multiple: boolean;
  options: McqOption[];
}

export interface PublicCodeQuestion {
  id: string;
  type: "code";
  title: string;
  prompt: string;
  points: number;
  functionName: string;
  starterCode: string;
  sampleCases: TestCase[];
}

export interface PublicTextQuestion {
  id: string;
  type: "text";
  title: string;
  prompt: string;
  points: number;
}

export type PublicQuestion = PublicMcqQuestion | PublicCodeQuestion | PublicTextQuestion;

export interface ActionResult {
  ok: boolean;
  message?: string;
}
