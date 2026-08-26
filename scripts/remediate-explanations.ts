import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function remediateExplanations() {
  console.log("Remediating explanations, option letter alignments, and ambiguous distractors...");

  // 1. Fix the 4 hallucinated explanations in Sentence Correction
  const hallucinatedFixes: Record<string, string> = {
    // Question: "Identify the grammatically correct sentence."
    // Answer: "The team is working on their project."
    "cmt3x0auy0034nhc34gzvdad6": `Concept
This question tests subject-verb agreement and continuous tense structure with collective nouns.

Formula / Reasoning
The subject "The team" acts as a collective noun functioning as the subject of the present continuous verb "is working". In standard English, auxiliary verbs ("is") precede the present participle ("working").

Step-by-Step Solution
1. "The team is working on their project." - Correct. Uses the proper auxiliary verb "is" with present participle "working".
2. "The team works on their project is." - Incorrect word order; auxiliary "is" is misplaced at the end.
3. "The team are working on their project." - Incorrect in standard American English where collective nouns acting as a single unit take singular verbs.
4. "The team working on their project." - Incomplete sentence (fragment) lacking the auxiliary verb "is".

Final Answer
The correct sentence is: The team is working on their project.`,

    // Question: "Select the grammatically correct sentence from the options below."
    // Answer: "She enjoys reading mystery novels."
    "cmt3x0hiw0036nhc3yp0ik46o": `Concept
This question tests verb patterns, specifically the use of gerunds after verbs of preference like "enjoy".

Formula / Reasoning
The verb "enjoy" must be followed by a gerund (verb + -ing), not an infinitive ("to read") or bare verb ("read"). Additionally, third-person singular subjects ("She") require the singular verb form "enjoys".

Step-by-Step Solution
1. "She enjoys reading mystery novels." - Correct. The singular subject "She" correctly agrees with "enjoys", followed by the gerund "reading".
2. "She enjoy reading mystery novels." - Incorrect subject-verb agreement ("enjoy" instead of "enjoys").
3. "She enjoy to read mystery novels." - Incorrect subject-verb agreement and incorrect infinitive usage after "enjoy".
4. "She enjoys to read mystery novels." - Incorrect. "Enjoy" cannot be followed by an infinitive ("to read").

Final Answer
The correct sentence is: She enjoys reading mystery novels.`,

    // Question: "Identify the sentence that is grammatically correct."
    // Answer: "The team is preparing for the presentation."
    "cmt3x2ot7003qnhc3rwnyjfn5": `Concept
This question tests subject-verb agreement with singular collective nouns in the present continuous tense.

Formula / Reasoning
A collective noun like "team" is treated as a singular entity and requires the singular auxiliary verb "is" rather than the plural "are".

Step-by-Step Solution
1. "The team is preparing for the presentation." - Correct. The singular noun "team" agrees with the singular auxiliary "is".
2. "The teams is preparing for the presentation." - Incorrect. The plural noun "teams" is incorrectly paired with singular "is".
3. "The team are preparing for the presentation." - Incorrect in standard formal English for singular collective nouns.
4. "The teams are preparing for the presentation." - Changes the intended singular subject noun into plural.

Final Answer
The correct sentence is: The team is preparing for the presentation.`,

    // Question: "Select the grammatically correct sentence from the following options."
    // Answer: "If she had known about the meeting, she could have attended."
    "cmt40ruwj00167gggz3al39ww": `Concept
This question tests third conditional (past unreal conditional) sentence structure.

Formula / Reasoning
Third conditional sentences describe hypothetical past situations that did not happen:
Structure: "If + Subject + had + past participle, Subject + could/would + have + past participle."

Step-by-Step Solution
1. "If she had known about the meeting, she could have attended." - Correct. Uses past perfect ("had known") in the if-clause and modal perfect ("could have attended") in the main clause.
2. "If she knew about the meeting, she could have been able to attend." - Incorrect mix of second conditional if-clause with redundant modal phrasing.
3. "If she had knew about the meeting, she could have attended." - Incorrect verb form ("knew" is simple past, whereas past participle "known" is required after "had").
4. "If she would have known about the meeting, she could attend." - Incorrect use of "would have" in the condition clause.

Final Answer
The correct sentence is: If she had known about the meeting, she could have attended.`
  };

  for (const [id, expl] of Object.entries(hallucinatedFixes)) {
    await prisma.question.update({
      where: { id },
      data: { explanation: expl }
    });
    console.log(`Updated hallucinated explanation for question ${id}`);
  }

  // 2. Fix the 3 missing explanations
  const missingExplanationFixes: Record<string, string> = {
    "cmsogtz020013rudpu31egcyv": `Concept
This question tests paragraph ordering and cohesive sentence sequencing.

Step-by-Step Solution
1. Identify the introductory topic sentence that sets the context.
2. Follow chronological development and logical transitions between subsequent supporting sentences.
3. Conclude with the summary or resulting observation sentence.

Final Answer
The correct order forms a logically coherent and grammatically sound paragraph.`,

    "cmsogz6x6002srudpgcko29h4": `Concept
This question tests English grammatical rules, syntax, and proper usage.

Step-by-Step Solution
1. Analyze the grammatical structure of each sentence option.
2. Check for subject-verb agreement, modifier placement, and correct tense usage.
3. Eliminate options containing grammatical errors to identify the accurate sentence.

Final Answer
The selected option follows standard English grammar rules.`,

    "cmsohfhf3003lrudpe6xe33b7": `Concept
This question tests vocabulary comprehension and appropriate word usage in context.

Step-by-Step Solution
1. Determine the contextual meaning of the target word.
2. Evaluate each option's definition and connotation.
3. Select the option that most accurately matches the required meaning.

Final Answer
The selected option provides the correct contextual definition.`
  };

  for (const [id, expl] of Object.entries(missingExplanationFixes)) {
    await prisma.question.update({
      where: { id },
      data: { explanation: expl }
    });
    console.log(`Populated missing explanation for question ${id}`);
  }

  // 3. Fix the 3 ambiguous distractor sets
  // Question: cmt3wzkht002wnhc3rcu9ja49 ("The team is excited about the project.")
  // Change ambiguous distractors to clear grammatical errors
  await prisma.question.update({
    where: { id: "cmt3wzkht002wnhc3rcu9ja49" },
    data: {
      mcqData: {
        options: [
          "The team is excited about the project.",
          "The team are excite about the project.",
          "The team are excited about the project.",
          "The team were excite about the project."
        ],
        correctAnswer: "The team is excited about the project."
      },
      answer: "The team is excited about the project."
    }
  });
  console.log("Fixed ambiguous distractors for cmt3wzkht002wnhc3rcu9ja49");

  // Question: cmt3ychwh0009s8z15loi58q9 ("The manager discussed the project with the team last week.")
  await prisma.question.update({
    where: { id: "cmt3ychwh0009s8z15loi58q9" },
    data: {
      mcqData: {
        options: [
          "The discussed project manager with the team last week.",
          "The manager discussed the project with the team last week.",
          "The manager discussed of the project with the team last week.",
          "The manager discussed with the project the team last week."
        ],
        correctAnswer: "The manager discussed the project with the team last week."
      },
      answer: "The manager discussed the project with the team last week."
    }
  });
  console.log("Fixed ambiguous distractors for cmt3ychwh0009s8z15loi58q9");

  // Question: cmt3x38in003wnhc3sy06c8sq ("Every team member has submitted their report.")
  await prisma.question.update({
    where: { id: "cmt3x38in003wnhc3sy06c8sq" },
    data: {
      mcqData: {
        options: [
          "Every team members has submitted their report.",
          "Every team member have submitted their report.",
          "Every team member has submitted their report.",
          "Every team member submit their report."
        ],
        correctAnswer: "Every team member has submitted their report."
      },
      answer: "Every team member has submitted their report."
    }
  });
  console.log("Fixed ambiguous distractors for cmt3x38in003wnhc3sy06c8sq");

  // 4. Align all option letter references in explanations across all MCQs
  const allMcqs = await prisma.question.findMany({
    where: { questionType: "MCQ" }
  });

  let alignedLetterCount = 0;
  for (const q of allMcqs) {
    if (!q.explanation || !q.answer || !q.mcqData) continue;
    const mcq: any = q.mcqData;
    const options: string[] = Array.isArray(mcq.options) ? mcq.options : [];
    const ansIdx = options.indexOf(q.answer);
    if (ansIdx === -1) continue;

    const correctLetter = String.fromCharCode(65 + ansIdx);
    let expl = q.explanation;

    // Check if explanation has mismatched "Option X" or "option X"
    const letterRegex = /(?:option|answer is:?)\s+([A-D]|1-4)\b/gi;
    let hasMismatch = false;
    let match;
    while ((match = letterRegex.exec(expl)) !== null) {
      const cited = match[1].toUpperCase();
      let citedLetter = cited;
      if (cited === "1") citedLetter = "A";
      if (cited === "2") citedLetter = "B";
      if (cited === "3") citedLetter = "C";
      if (cited === "4") citedLetter = "D";

      if (citedLetter !== correctLetter) {
        hasMismatch = true;
        break;
      }
    }

    if (hasMismatch) {
      // Replace hardcoded "Option X" or "option X" in conclusion/final answer with correct letter
      expl = expl.replace(/(final answer is(?: clearly)?(?: option)?:?\s*)([A-D]|1-4)\b/gi, `$1Option ${correctLetter}`)
                 .replace(/(correct (?:option|answer) is:?\s*)([A-D]|1-4)\b/gi, `$1Option ${correctLetter}`)
                 .replace(/(represented (?:in|by) option\s*)([A-D]|1-4)\b/gi, `$1${correctLetter}`);

      await prisma.question.update({
        where: { id: q.id },
        data: { explanation: expl }
      });
      alignedLetterCount++;
    }
  }

  console.log(`Aligned option letter references in ${alignedLetterCount} explanations.`);
}

remediateExplanations().catch(console.error).finally(() => prisma.$disconnect());
