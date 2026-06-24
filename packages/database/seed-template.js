const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.template.create({
    data: {
      name: "Demo React Hook Question",
      templateKey: "demo-react-hook",
      conceptKey: "react_hooks",
      difficultyLevel: "MEDIUM",
      questionType: "coding",
      structure: {
        prompt:
          "Write a custom React hook named {{hookName}} that tracks the window dimensions. It should return an object with width and height.",
      },
      variables: {
        create: [
          {
            variableName: "hookName",
            variableType: "STRING",
            required: true,
            defaultValue: "useWindowSize",
          },
        ],
      },
      solutionTemplate: {
        create: {
          solutionTemplate: `import { useState, useEffect } from 'react';

export function {{hookName}}() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}`,
          explanationTemplate:
            "This hook uses useState to store the dimensions and useEffect to attach a resize event listener to the window object.",
        },
      },
    },
  });
  console.log("Created Template ID:", t.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
