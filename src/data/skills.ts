export type Skill = string;

export interface RoleSeed {
  name: string;
  skills: Skill[];
}

export const DEFAULT_ROLES: RoleSeed[] = [
  {
    name: "Frontend Developer",
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "HTML",
      "CSS",
      "Tailwind CSS",
      "Bootstrap",
      "Accessibility",
      "SEO",
      "Performance Optimization",
      "REST APIs",
      "Contentful",
      "Git",
    ],
  },
  {
    name: "Backend Developer",
    skills: ["JavaScript", "TypeScript", "Node.js", "Express", "Python", "SQL", "MongoDB", "REST APIs", "Docker", "Git"],
  },
  {
    name: "Full Stack Developer",
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Express",
      "HTML",
      "CSS",
      "Tailwind CSS",
      "MongoDB",
      "SQL",
      "REST APIs",
      "Contentful",
      "Performance Optimization",
      "Git",
    ],
  },
  {
    name: "QA Engineer",
    skills: [
      "Functional testing",
      "System testing",
      "Automation",
      "API Testing",
      "Security Testing",
      "Usability testing",
      "Performance Testing",
      "SQL",
      "Git",
    ],
  },
  {
    name: "UI/UX Designer",
    skills: [
      "UI",
      "UX",
      "Visual design",
      "Wireframing",
      "Prototyping",
      "Usability testing",
      "Figma",
      "Design Systems",
      "Accessibility",
      "HTML",
      "CSS",
    ],
  },
  {
    name: "DevOps Engineer",
    skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "Cloud", "Monitoring", "Networking", "Git", "Python"],
  },
  {
    name: "AI/ML Engineer",
    skills: ["Python", "Machine Learning", "Deep Learning", "Data Analysis", "Statistics", "LLMs", "SQL", "Git"],
  },
  {
    name: "Business Analyst",
    skills: [
      "Requirements Gathering",
      "User Stories",
      "Process Modelling",
      "Stakeholder Management",
      "Agile",
      "Data Analysis",
      "SQL",
      "Documentation",
    ],
  },
];

export function sortSkills(skills: Iterable<string>): string[] {
  return Array.from(new Set(skills)).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export const DEFAULT_SKILLS: Skill[] = sortSkills(DEFAULT_ROLES.flatMap((role) => role.skills));
