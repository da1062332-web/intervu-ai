import * as fs from "fs";

// Let's write the SQL directly into a text file and read it with fs.readFileSync
fs.writeFileSync("batch_input.sql", `INSERT INTO "public"."questions" ("id", "question_text", "answer", "explanation", "topic_id", "section_id", "difficulty", "difficulty_score", "source", "template_id", "version", "status", "times_used", "last_used", "created_at", "updated_at", "metadata", "attachments", "coding_data", "concept_id", "estimated_time", "instructions", "mcq_data", "question_image", "question_source", "question_statement", "question_title", "question_type", "batch_id") VALUES ('cmt411y5t00397gggnqeupbao', 'Identify the correct sentence among the following options.', 'Each of the participants has received their certificate.', 'Concept
This question tests the understanding of subject-verb agreement and proper use of singular vs. plural forms in sentences.

Formula / Reasoning
In English, subjects that are singular must be paired with singular verbs, and collective nouns take singular verbs if they are treated as a single entity.

Step-by-Step Solution
1. The subject ''Each of the participants'' is singular, which means it should be followed by a singular verb. 
2. Option A incorrectly uses ''were,'' which does not agree with the singular subject. 
3. Option C uses ''receive,'' which is not conjugated correctly for the present perfect tense.
4. Option D incorrectly uses ''certificates,'' failing to recognize that ''certificate'' should remain singular as ''Each participant'' refers to one certificate each.
5. Therefore, the correct answer is Option B, which correctly uses ''has received'' in accordance with the singular subject.

Final Answer
The correct option is: Each of the participants has received their certificate.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:58:53.105', '2026-08-26 05:03:37.83', '{"options": ["Each participant receive their certificate.", "Each of the participants has received their certificate.", "Each participant has received their certificates.", "Each of the participants were given a certificate."], "_generatedQuestionId": "cmt40zja5002e7gggi7j31ud8"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Each participant receive their certificate.", "Each of the participants has received their certificate.", "Each participant has received their certificates.", "Each of the participants were given a certificate."], "correctAnswer": "Each of the participants has received their certificate."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x04cb0032nhc354buyw3a', 'Identify the correct sentence from the options below.', 'I finished the report last week.', 'Concept
The concept being tested is the correct use of past tense in sentence structure.

Formula / Reasoning
The simple past tense is used to describe actions that were completed at a specific time in the past. The correct structure must also align with the time reference provided in the sentence.

Step-by-Step Solution
1. The phrase ''last week'' indicates that the action was completed in the past. Therefore, the simple past tense should be used. 
2. Option A incorrectly uses ''have finished,'' which is present perfect and does not fit the time reference. 
3. Option B uses ''finish,'' which is present tense and also incorrect for the past reference. 
4. Option D uses ''finishing,'' which is present continuous and not correct for this context. 
5. Option C correctly uses ''finished,'' which aligns with the past time reference provided by ''last week.''

Final Answer
The correct answer is C: I finished the report last week.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:05:29.34', '2026-08-26 05:03:37.83', '{"options": ["I finish the report last week.", "I finishing the report last week.", "Last week, I have finished the report.", "I finished the report last week."], "_generatedQuestionId": "cmt3wvtsw002bnhc33usv9n8b"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["I finish the report last week.", "I finishing the report last week.", "Last week, I have finished the report.", "I finished the report last week."], "correctAnswer": "I finished the report last week."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3wzdz0002unhc3hmg4lcma', 'Identify the correct sentence regarding the project''s deadline.', 'The deadline is sooner than we expected.', 'Concept
The question tests the correct use of comparative adjectives in English.

Formula / Reasoning
The correct form of the comparative adjective ''soon'' is ''sooner''.

Step-by-Step Solution
1. The adjective ''soon'' is used to indicate time. To compare it with another time frame, we use the comparative form ''sooner''.
2. Option 1 uses ''sooner'', which is correct.
3. Options 2 and 3 incorrectly use ''more soon'' and ''more sooner'', which are not grammatically correct.
4. Option 4 uses ''soon'' without the comparative form, making it incorrect for comparison.

Final Answer
The final answer is clearly option 1: ''The deadline is sooner than we expected.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:04:55.165', '2026-08-26 05:03:37.83', '{"options": ["The deadline is more soon than we expected.", "The deadline is sooner than we expected.", "The deadline is more sooner than we expected.", "The deadline is soon than we expected."], "_generatedQuestionId": "cmt3wx3kc002nnhc3mo477pt4"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The deadline is more soon than we expected.", "The deadline is sooner than we expected.", "The deadline is more sooner than we expected.", "The deadline is soon than we expected."], "correctAnswer": "The deadline is sooner than we expected."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3wzxo90030nhc3hrmzslml', 'Identify the correct statement regarding the team meeting schedule.', 'The team meets every Tuesday at 10 AM.', 'Concept
The concept being tested is subject-verb agreement in the context of a scheduled event.

Formula / Reasoning
In English, a singular subject requires a singular verb form, while a plural subject requires a plural verb form.

Step-by-Step Solution
1. Option A (''The team meet every Tuesday at 10 AM.'') uses ''meet'' which is incorrect for the singular subject ''team''.
2. Option B (''The team meets every Tuesday at 10 AM.'') correctly uses ''meets'' which agrees with the singular subject ''team''.
3. Option C (''The team meeting every Tuesday at 10 AM.'') is incomplete as it lacks a verb.
4. Option D (''The team is meeting every Tuesday at 10 AM.'') uses a present continuous form which is not the most suitable for a regular event statement.

Final Answer
The final answer is clearly Option B: ''The team meets every Tuesday at 10 AM.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:05:20.697', '2026-08-26 05:02:01.646', '{"options": ["The team meets every Tuesday at 10 AM.", "The team meet every Tuesday at 10 AM.", "The team meeting every Tuesday at 10 AM.", "The team is meeting every Tuesday at 10 AM."], "_generatedQuestionId": "cmt3ww4w0002enhc3buhikrvt"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team meets every Tuesday at 10 AM.", "The team meet every Tuesday at 10 AM.", "The team meeting every Tuesday at 10 AM.", "The team is meeting every Tuesday at 10 AM."], "correctAnswer": "The team meets every Tuesday at 10 AM."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40shi5001o7gggj85p2t0z', 'Identify the correctly constructed sentence regarding the project proposal.', 'If the project proposal had been submitted on time, it would have received positive feedback.', 'Concept
This question assesses the ability to recognize the correct use of conditional sentences in English grammar.

Formula / Reasoning
The correct sentence must utilize the past perfect conditional form to indicate a hypothetical situation that did not occur.

Step-by-Step Solution
1. The correct construction for a past hypothetical situation requires ''had been submitted'' to indicate that the proposal was not submitted on time.
2. Option A uses ''was submitted'', which is incorrect for a hypothetical past situation.
3. Option B uses ''has been submitted'', which is not suitable for this context as it implies a current relevance rather than a past condition.
4. Option D uses ''were submitted'', which is in the subjunctive mood but does not fit the past perfect conditional needed here.

Final Answer
The correct answer is: If the project proposal had been submitted on time, it would have received positive feedback.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:31.613', '2026-08-26 05:03:37.83', '{"options": ["If the project proposal were submitted on time, it would receive positive feedback.", "If the project proposal was submitted on time, it would have received positive feedback.", "If the project proposal has been submitted on time, it would receive positive feedback.", "If the project proposal had been submitted on time, it would have received positive feedback."], "_generatedQuestionId": "cmt3ytcjs000zs8z1kkp0d3tp"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["If the project proposal were submitted on time, it would receive positive feedback.", "If the project proposal was submitted on time, it would have received positive feedback.", "If the project proposal has been submitted on time, it would receive positive feedback.", "If the project proposal had been submitted on time, it would have received positive feedback."], "correctAnswer": "If the project proposal had been submitted on time, it would have received positive feedback."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x1ekd003enhc3xwmbb176', 'Identify the correctly structured sentence among the following options.', 'The team has completed their project successfully.', 'Concept
This question tests the correct use of singular and plural subject-verb agreement in English sentences.

Formula / Reasoning
In English, collective nouns like ''team'' are typically treated as singular when the group acts as a single unit, thus requiring singular verb forms.

Step-by-Step Solution
1. The first option (''The team have completed their project successfully.'') incorrectly uses ''have'' with a singular collective noun. 
2. The second option (''The team has completed their project successfully.'') correctly uses ''has'', aligning with the singular nature of ''team''. 
3. The third option (''The team are completing their project successfully.'') incorrectly uses ''are'', which is plural and does not agree with ''team''. 
4. The fourth option (''The team completes their project successfully.'') is grammatically correct but does not reflect the completed action implied by ''has completed''.

Final Answer
The final answer is clearly option B: ''The team has completed their project successfully.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:06:29.245', '2026-08-26 05:03:37.83', '{"options": ["The team are completing their project successfully.", "The team has completed their project successfully.", "The team have completed their project successfully.", "The team completes their project successfully."], "_generatedQuestionId": "cmt3wqfur001onhc38s9uyyeb"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team are completing their project successfully.", "The team has completed their project successfully.", "The team have completed their project successfully.", "The team completes their project successfully."], "correctAnswer": "The team has completed their project successfully."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40rogu00127ggggu3bjjkj', 'Identify the correctly structured sentence from the following options.', 'The team has finalized their report on the new strategy.', 'Concept
This question tests the ability to identify correct subject-verb agreement in sentences.

Formula / Reasoning
In English grammar, singular subjects require singular verbs, and plural subjects require plural verbs. Here, the collective noun ''team'' is treated as a singular entity, hence it requires a singular verb.

Step-by-Step Solution
1. ''Each of the team members have completed their project.'' - Incorrect because ''each'' is singular, thus it should be ''has''.
2. ''Neither of the proposals seem satisfactory.'' - Incorrect because ''neither'' is singular, so it should be ''seems''.
3. ''The committee have reached a decision regarding the budget.'' - Incorrect because ''committee'' is a collective noun and should take a singular verb ''has''.
4. ''The team has finalized their report on the new strategy.'' - Correct because ''team'' is treated as a singular noun and ''has'' is the correct verb form.

Final Answer
The final answer is: The team has finalized their report on the new strategy.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:50:53.983', '2026-08-26 05:03:37.83', '{"options": ["Neither of the proposals seem satisfactory.", "The team has finalized their report on the new strategy.", "The committee have reached a decision regarding the budget.", "Each of the team members have completed their project."], "_generatedQuestionId": "cmt40oody000v7gggmawbjets"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Neither of the proposals seem satisfactory.", "The team has finalized their report on the new strategy.", "The committee have reached a decision regarding the budget.", "Each of the team members have completed their project."], "correctAnswer": "The team has finalized their report on the new strategy."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x38in003wnhc3sy06c8sq', 'Identify the correctly structured sentence from the options below.', 'Every team member has submitted their report.', 'Concept

The concept being tested is verb agreement with the subject in a sentence.

Formula / Reasoning

The subject ''Every team member'' is singular, and thus requires the singular verb ''has'' instead of ''have''.

Step-by-Step Solution

1. In the first option, ''Every team member have submitted their report.'', ''have'' is incorrect because ''Every team member'' is singular and requires ''has''.
2. The second option, ''Every team member has submitted their report.'', correctly uses ''has'' for the singular subject.
3. In the third option, ''Every team members has submitted their report.'', ''members'' is plural and should not be used with ''Every''.
4. The fourth option, ''Every team member submits their reports.'', while grammatically correct, changes the tense and does not match the original intent of completed action.

Final Answer
The final answer is: Every team member has submitted their report.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:07:54.719', '2026-08-26 05:03:37.83', '{"options": ["Every team members has submitted their report.", "Every team member have submitted their report.", "Every team member has submitted their report.", "Every team member submits their reports."], "_generatedQuestionId": "cmt3wncmb000unhc3w17usgn5"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Every team members has submitted their report.", "Every team member have submitted their report.", "Every team member has submitted their report.", "Every team member submits their reports."], "correctAnswer": "Every team member has submitted their report."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x3luf0040nhc3f0kkxe5h', 'Identify the correctly structured sentence regarding the team''s project update.', 'The team has completed the project successfully.', 'Concept
This question tests the correct usage of subject-verb agreement in sentences involving collective nouns.

Formula / Reasoning
In English, collective nouns like ''team'' are typically treated as singular entities when referring to the group as a whole, thus requiring a singular verb form.

Step-by-Step Solution
1. ''The team have completed the project successfully.'' - Incorrect, ''have'' should be ''has'' for singular subject.
2. ''The team has completed the project successfully.'' - Correct, ''has'' agrees with the singular collective noun ''team''.
3. ''The team completes the project successfully.'' - Incorrect, as it suggests an ongoing action rather than completion.
4. ''The team is completed the project successfully.'' - Incorrect, ''is completed'' is an improper construction for this context; it suggests passive voice incorrectly.

Final Answer
The final answer is: The team has completed the project successfully.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:08:11.991', '2026-08-26 05:03:37.83', '{"options": ["The team has completed the project successfully.", "The team have completed the project successfully.", "The team completes the project successfully.", "The team is completed the project successfully."], "_generatedQuestionId": "cmt3wltzc000mnhc3wey2rfaw"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team has completed the project successfully.", "The team have completed the project successfully.", "The team completes the project successfully.", "The team is completed the project successfully."], "correctAnswer": "The team has completed the project successfully."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x11dp003anhc3bgfxxsn8', 'Identify the correctly structured sentence.', 'She enjoys reading novels.', 'Concept
This question tests your understanding of verb forms and gerunds in sentence structure.

Formula / Reasoning
The verb ''enjoy'' is always followed by a gerund (the ''-ing'' form of a verb).

Step-by-Step Solution
1. Option A (''She enjoys to read novels.'') is incorrect because ''enjoy'' should be followed by a gerund, not an infinitive.
2. Option B (''She enjoys reading novels.'') is correct as it properly uses the gerund form ''reading'' after ''enjoys''.
3. Option C (''She enjoy reading novels.'') is incorrect due to subject-verb agreement; it should be ''enjoys'' for the singular subject ''She''.
4. Option D (''She enjoy to read novels.'') is incorrect for the same reason as Option A; it incorrectly uses ''to read'' instead of ''reading''.

Final Answer
The correct option is B: She enjoys reading novels.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:06:12.157', '2026-08-26 05:03:37.83', '{"options": ["She enjoys reading novels.", "She enjoy reading novels.", "She enjoy to read novels.", "She enjoys to read novels."], "_generatedQuestionId": "cmt3wr1ho001unhc3dd1j1mdd"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["She enjoys reading novels.", "She enjoy reading novels.", "She enjoy to read novels.", "She enjoys to read novels."], "correctAnswer": "She enjoys reading novels."}', null, 'MANUAL', null, null, 'MCQ', null);
`);

console.log("Written batch_input.sql");
