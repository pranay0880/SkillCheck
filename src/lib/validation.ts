import { z } from "zod";
import { LEVELS, LINK_AUDIENCES, ORDER_MODES } from "./types";
import { SKILLS } from "@/data/skills";

const baseQuestion = {
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(120),
  prompt: z.string().trim().min(5, "Question text is too short").max(5000),
  level: z.enum(LEVELS),
  skill: z.enum(SKILLS, "Choose a skill"),
  points: z.number().int().min(1).max(100),
};

export const mcqQuestionSchema = z
  .object({
    ...baseQuestion,
    type: z.literal("mcq"),
    options: z
      .array(z.object({ id: z.string().min(1).max(8), text: z.string().trim().min(1, "Options cannot be empty").max(500) }))
      .min(2, "Add at least 2 options")
      .max(8),
    correctOptionIds: z.array(z.string()).min(1, "Mark at least one correct option"),
  })
  .refine((q) => q.correctOptionIds.every((id) => q.options.some((o) => o.id === id)), {
    message: "Correct answer must be one of the options",
    path: ["correctOptionIds"],
  });

export const codeQuestionSchema = z.object({
  ...baseQuestion,
  type: z.literal("code"),
  functionName: z
    .string()
    .trim()
    .regex(/^[A-Za-z_$][\w$]*$/, "Function name must be a valid JavaScript identifier"),
  starterCode: z.string().max(5000),
  testCases: z
    .array(z.object({ args: z.array(z.unknown()), expected: z.unknown(), hidden: z.boolean() }))
    .min(1, "Add at least one test case")
    .max(30),
});

export const textQuestionSchema = z.object({
  ...baseQuestion,
  type: z.literal("text"),
  markingGuide: z.string().trim().max(5000),
});

export const questionSchema = z.discriminatedUnion("type", [mcqQuestionSchema, codeQuestionSchema, textQuestionSchema]);
export type QuestionInput = z.infer<typeof questionSchema>;

export const testSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(120),
  description: z.string().trim().max(2000),
  durationMinutes: z.number().int().min(5, "Minimum 5 minutes").max(300, "Maximum 300 minutes"),
  questionIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1, "Pick at least one question"),
  orderMode: z.enum(ORDER_MODES),
  shuffleOptions: z.boolean(),
  requireFullscreen: z.boolean(),
});
export type TestInput = z.infer<typeof testSchema>;

export const testLinkSchema = z
  .object({
    label: z.string().trim().max(60, "Keep the label under 60 characters"),
    audience: z.enum(LINK_AUDIENCES),
    roles: z.array(z.string().trim().min(1).max(60)).max(50),
    userIds: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid user")).max(500),
  })
  .refine((link) => link.audience !== "roles" || link.roles.length > 0, {
    message: "Choose at least one role",
    path: ["roles"],
  })
  .refine((link) => link.audience !== "users" || link.userIds.length > 0, {
    message: "Select at least one user",
    path: ["userIds"],
  });

export const otpCodeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email");

export const joinSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter your employee email")).pipe(z.string().max(120)),
  employeeId: z.string().trim().min(1, "Enter your employee ID").max(30),
});

export const userSchema = z.object({
  name: z.string().trim().min(2, "Name is required (at least 2 characters)").max(80),
  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID is required")
    .max(30, "Employee ID is too long")
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Employee ID can contain letters, numbers, . _ / -"),
  role: z.string().trim().min(2, "Role is required").max(60),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid employee email")).pipe(z.string().max(120)),
  skills: z
    .array(z.string().trim().min(1).max(40, "Each skill must be 40 characters or fewer"))
    .min(1, "Add at least one skill")
    .max(30, "Up to 30 skills")
    .transform((skills) => {
      const seen = new Set<string>();
      return skills.filter((skill) => {
        const key = skill.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }),
});
export type UserInput = z.infer<typeof userSchema>;

export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? issue.message : "Invalid input";
}
