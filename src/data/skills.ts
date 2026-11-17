export const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "Python",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "Git",
  "MongoDB",
  "SQL",
  "REST APIs",
  "Contentful",
  "Accessibility",
  "SEO",
  "Performance Optimization",
] as const;

export type Skill = (typeof SKILLS)[number];

export function isSkill(value: string): value is Skill {
  return (SKILLS as readonly string[]).includes(value);
}
