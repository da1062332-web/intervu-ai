import * as fs from "fs";

// Read the SQL file or define the SQL string
const sqlText = `INSERT INTO "public"."questions" ("id", "question_text", "answer", "explanation", "topic_id", "section_id", "difficulty", "difficulty_score", "source", "template_id", "version", "status", "times_used", "last_used", "created_at", "updated_at", "metadata", "attachments", "coding_data", "concept_id", "estimated_time", "instructions", "mcq_data", "question_image", "question_source", "question_statement", "question_title", "question_type", "batch_id") VALUES ('cmt411y5t00397gggnqeupbao', 'Identify the correct sentence among the following options.', 'Each of the participants has received their certificate.', 'Concept
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
The correct option is B: She enjoys reading novels.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:06:12.157', '2026-08-26 05:03:37.83', '{"options": ["She enjoys reading novels.", "She enjoy reading novels.", "She enjoy to read novels.", "She enjoys to read novels."], "_generatedQuestionId": "cmt3wr1ho001unhc3dd1j1mdd"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["She enjoys reading novels.", "She enjoy reading novels.", "She enjoy to read novels.", "She enjoys to read novels."], "correctAnswer": "She enjoys reading novels."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40rwlz00187gggocn38dxo', 'Identify the grammatically correct sentence about the project requirements.', 'The project requirements are clearly defined in the document.', 'Concept
This question tests the understanding of subject-verb agreement in sentences.

Formula / Reasoning
In English, a plural subject requires a plural verb form. Here, ''requirements'' is plural, so it needs the plural verb ''are''.

Step-by-Step Solution
1. The subject ''project requirements'' is plural because it refers to multiple needs. 
2. The correct verb form for a plural subject is ''are''. 
3. The other options misstate the verb form: ''is'' and ''was'' are singular, and ''requirement'' is singular instead of plural.
4. Thus, the only option that maintains correct subject-verb agreement is ''The project requirements are clearly defined in the document.''

Final Answer
The final answer is clearly option C: ''The project requirements are clearly defined in the document.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:04.535', '2026-08-26 05:03:37.83', '{"options": ["The project requirements are clearly defined in the document.", "The project requirement are clearly defined in the document.", "The project requirements was clearly defined in the document.", "The project requirements is clearly defined in the document."], "_generatedQuestionId": "cmt40nk29000k7ggghdx5fdbb"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The project requirements are clearly defined in the document.", "The project requirement are clearly defined in the document.", "The project requirements was clearly defined in the document.", "The project requirements is clearly defined in the document."], "correctAnswer": "The project requirements are clearly defined in the document."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3yco0q000hs8z1fe85usxp', 'Identify the grammatically correct sentence among the following options.', 'The manager suggested revising the project timeline.', 'Concept

This question tests the understanding of verb forms and gerunds in English sentences.

Formula / Reasoning

The correct form after the verb ''suggest'' is a gerund (the -ing form of the verb).

Step-by-Step Solution

1. ''The manager suggested to revise the project timeline.'' - Incorrect because ''suggest'' does not take ''to'' before the verb.
2. ''The manager suggested revising the project timeline.'' - Correct as it properly uses the gerund form after ''suggest''.
3. ''The manager suggested revising of the project timeline.'' - Incorrect usage of ''of'' which is not needed here.
4. ''The manager suggested for revising the project timeline.'' - Incorrect as ''for'' is unnecessary after ''suggest''.

Final Answer
The final answer is clearly option B: ''The manager suggested revising the project timeline.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:14.33', '2026-08-26 05:03:37.83', '{"options": ["The manager suggested revising the project timeline.", "The manager suggested revising of the project timeline.", "The manager suggested for revising the project timeline.", "The manager suggested to revise the project timeline."], "_generatedQuestionId": "cmt3xebzd004qnhc31omxp7ur"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The manager suggested revising the project timeline.", "The manager suggested revising of the project timeline.", "The manager suggested for revising the project timeline.", "The manager suggested to revise the project timeline."], "correctAnswer": "The manager suggested revising the project timeline."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3ychwh0009s8z15loi58q9', 'Identify the grammatically correct sentence from the following options.', 'The manager discussed the project with the team last week.', 'Concept

The concept being tested is the ability to identify grammatically correct sentence structures.

Formula / Reasoning

A correct sentence should maintain a clear subject-verb-object structure, ensuring that the relationships between the entities are logically and grammatically sound.

Step-by-Step Solution

1. In the first option, ''The manager discussed the project with the team last week.'', the sentence is correctly structured, with ''the manager'' as the subject, ''discussed'' as the verb, and ''the project'' and ''the team'' as the objects.
2. The second option, ''The manager discussed with the project the team last week.'', misplaces the object and creates confusion about who is discussing with whom.
3. The third option, ''The discussed project manager with the team last week.'', erroneously rearranges the sentence, resulting in an awkward structure that lacks clarity.
4. The fourth option, ''Last week, the project manager discussed with the team.'', while it places the time at the beginning, alters the subject and verb arrangement but is still grammatically correct; however, it does not directly connect the subject to the action as clearly as the first option.

Final Answer
The final answer is clearly the first option: ''The manager discussed the project with the team last week.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:06.401', '2026-08-26 05:03:37.83', '{"options": ["The discussed project manager with the team last week.", "The manager discussed the project with the team last week.", "Last week, the project manager discussed with the team.", "The manager discussed with the project the team last week."], "_generatedQuestionId": "cmt3xlzsy0053nhc3awevd27r"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The discussed project manager with the team last week.", "The manager discussed the project with the team last week.", "Last week, the project manager discussed with the team.", "The manager discussed with the project the team last week."], "correctAnswer": "The manager discussed the project with the team last week."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3wzkht002wnhc3rcu9ja49', 'Identify the grammatically correct sentence from the options below.', 'The team is excited about the project.', 'Concept
Correct verb forms in subject-verb agreement.

Formula / Reasoning
In English, collective nouns like ''team'' are typically treated as singular when the group acts as a single unit, thus requiring a singular verb form.

Step-by-Step Solution
1. ''The team are excited about the project.'' - Incorrect, as ''team'' is singular and requires a singular verb.
2. ''The team were excited about the project.'' - Incorrect for the same reason; ''were'' is plural.
3. ''The team is excited about the project.'' - Correct, as ''is'' is the singular form needed for the collective noun.
4. ''The team was excited about the project.'' - This is also correct, but ''is'' is more appropriate in present context.

Final Answer
The final answer is clearly option C: ''The team is excited about the project.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:05:03.618', '2026-08-26 05:03:37.83', '{"options": ["The team was excited about the project.", "The team is excited about the project.", "The team are excited about the project.", "The team were excited about the project."], "_generatedQuestionId": "cmt3wws03002knhc3ojad5p6z"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team was excited about the project.", "The team is excited about the project.", "The team are excited about the project.", "The team were excited about the project."], "correctAnswer": "The team is excited about the project."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40s6aq001g7gggkagmhwte', 'Identify the grammatically correct sentence regarding project deadlines.', 'Each team member and each supervisor is accountable for meeting deadlines.', 'Concept
This question tests the understanding of subject-verb agreement in sentences with compound subjects.

Formula / Reasoning
In English grammar, when subjects are joined by ''and,'' they are usually treated as plural. However, when the subjects are preceded by ''each,'' they are treated as singular, requiring a singular verb.

Step-by-Step Solution
1. Analyze the subjects: ''each team member'' and ''each supervisor'' are both singular due to the use of ''each.''
2. Determine the verb form needed: since both subjects are singular, the correct form of the verb should also be singular (''is'').
3. Evaluate the options: 
   - Option A is incorrect because it uses ''are.''
   - Option B is correct because it uses ''is.''
   - Option C is incorrect because it uses ''were,'' which is past tense.
   - Option D is incorrect because it uses ''have,'' which does not agree with ''each.''

Final Answer
The correct option is: Each team member and each supervisor is accountable for meeting deadlines.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:17.09', '2026-08-26 05:03:37.83', '{"options": ["Each team member and each supervisor are accountable for meeting deadlines.", "Each team member and each supervisor is accountable for meeting deadlines.", "Each team member and each supervisor have accountability for meeting deadlines.", "Each team member and each supervisor were accountable for meeting deadlines."], "_generatedQuestionId": "cmt40mdza00067ggg8kd8i7bi"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Each team member and each supervisor are accountable for meeting deadlines.", "Each team member and each supervisor is accountable for meeting deadlines.", "Each team member and each supervisor have accountability for meeting deadlines.", "Each team member and each supervisor were accountable for meeting deadlines."], "correctAnswer": "Each team member and each supervisor is accountable for meeting deadlines."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3ycd5o0003s8z1k6uovcbe', 'Identify the grammatically correct sentence regarding the project team.', 'The team of engineers is meeting to discuss the project.', 'Concept

This question tests the understanding of subject-verb agreement, particularly with collective nouns.

Formula / Reasoning

When a collective noun (like ''team'') is used, it typically takes a singular verb when considered as a single entity. In this case, ''team'' is treated as one unit.

Step-by-Step Solution

1. Analyze each option for subject-verb agreement: ''team'' is singular, thus it requires a singular verb.
2. Option A (''are meeting'') incorrectly uses a plural verb with a singular subject.
3. Option C (''teams is meeting'') incorrectly uses a singular verb with a plural subject.
4. Option D (''were meeting'') also incorrectly uses a plural verb with a singular subject.
5. Option B (''is meeting'') correctly uses a singular verb with the singular subject ''team''.

Final Answer
The final answer is clearly represented in option B: ''The team of engineers is meeting to discuss the project.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:00.248', '2026-08-26 05:03:37.83', '{"options": ["The team of engineers is meeting to discuss the project.", "The team of engineers were meeting to discuss the project.", "The team of engineers are meeting to discuss the project.", "The teams of engineers is meeting to discuss the project."], "_generatedQuestionId": "cmt3xwgpb005inhc3ghifrqcx"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team of engineers is meeting to discuss the project.", "The team of engineers were meeting to discuss the project.", "The team of engineers are meeting to discuss the project.", "The teams of engineers is meeting to discuss the project."], "correctAnswer": "The team of engineers is meeting to discuss the project."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40rjm600107ggggovhofu9', 'Identify the grammatically correct sentence regarding the responsibilities of the teams.', 'Neither the sales team nor the marketing team has met their targets.', 'Concept

The concept being tested is subject-verb agreement in sentences involving compound subjects connected by ''nor''.

Formula / Reasoning

When a compound subject is joined by ''nor'', the verb should agree with the noun closest to it. In this case, ''team'' is singular, so the verb must also be singular.

Step-by-Step Solution
1. Analyze the structure: ''Neither the sales team nor the marketing team'' indicates a singular subject due to ''nor''.
2. Identify the closest noun to the verb: ''team'' is singular.
3. Choose the correct form of the verb: since the subject is singular, the correct verb form is ''has''.
4. Compare with other options: Options that use ''have'', ''were'', or ''are'' are incorrect because they imply plurality or incorrect tense.

Final Answer
The final answer is clearly option B: ''Neither the sales team nor the marketing team has met their targets.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:50:47.689', '2026-08-26 05:03:37.83', '{"options": ["Neither the sales team nor the marketing team has met their targets.", "Neither the sales team nor the marketing team were meeting their targets.", "Neither the sales team nor the marketing team have met their targets.", "Neither the sales team nor the marketing team are meeting their targets."], "_generatedQuestionId": "cmt40oxjq000y7gggmwi0oe6k"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Neither the sales team nor the marketing team has met their targets.", "Neither the sales team nor the marketing team were meeting their targets.", "Neither the sales team nor the marketing team have met their targets.", "Neither the sales team nor the marketing team are meeting their targets."], "correctAnswer": "Neither the sales team nor the marketing team has met their targets."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x3sd30042nhc3m93feh8r', 'Identify the grammatically correct sentence regarding the team''s performance.', 'The team has performed better than expected.', 'Concept
The concept being tested is correct usage of comparative adjectives in sentences.

Formula / Reasoning
The correct form for comparing performance is to use ''better than'' when indicating that something exceeds expectations.

Step-by-Step Solution
1. Analyze each option for grammatical correctness. ''Good'' is an adjective and should not be used here; the comparative form ''better'' is needed. 
2. The first option incorrectly uses ''well than,'' which is incorrect. 
3. The third option misuses ''good'' instead of ''better.'' 
4. The fourth option incorrectly uses ''well to'' instead of ''well than.'' 
5. The second option correctly uses ''better than,'' making it the right choice.

Final Answer
The correct answer is option B: The team has performed better than expected.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:08:20.439', '2026-08-26 05:03:37.83', '{"options": ["The team has performed good than expected.", "The team has performed better than expected.", "The team has performed well than expected.", "The team has performed well to expected."], "_generatedQuestionId": "cmt3wlibg000jnhc3oli39kqg"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team has performed good than expected.", "The team has performed better than expected.", "The team has performed well than expected.", "The team has performed well to expected."], "correctAnswer": "The team has performed better than expected."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40s8lh001i7gggay0tfehn', 'Identify the grammatically correct sentence regarding the team''s project outcomes.', 'The results of the project are satisfactory for our stakeholders.', 'Concept

This question tests knowledge of subject-verb agreement in complex sentences involving plural subjects.

Formula / Reasoning

In English, when the subject of a sentence is plural, the verb must also be in the plural form to maintain grammatical harmony.

Step-by-Step Solution

1. Analyze the subject: ''The results of the project'' is plural (''results''). Therefore, the verb must also be in plural form. 
2. Review the options: The first option uses ''is,'' which is incorrect for a plural subject. 
3. The second option uses ''are,'' which correctly matches the plural subject. 
4. The third option incorrectly uses ''are'' with ''result,'' which is singular, hence incorrect. The fourth option incorrectly uses ''were,'' which changes the tense but maintains verb agreement, thus it is not the best option for indicating current satisfaction.

Final Answer
The correct option is clearly: The results of the project are satisfactory for our stakeholders.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:20.069', '2026-08-26 05:03:37.83', '{"options": ["The results of the project are satisfactory for our stakeholders.", "The result of the project are satisfactory for our stakeholders.", "The results of the project is satisfactory for our stakeholders.", "The results of the project were satisfactory for our stakeholders."], "_generatedQuestionId": "cmt40m7mb00037gggs8zcsi28"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The results of the project are satisfactory for our stakeholders.", "The result of the project are satisfactory for our stakeholders.", "The results of the project is satisfactory for our stakeholders.", "The results of the project were satisfactory for our stakeholders."], "correctAnswer": "The results of the project are satisfactory for our stakeholders."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x0auy0034nhc34gzvdad6', 'Identify the grammatically correct sentence.', 'The team is working on their project.', 'Concept
This question tests the understanding of proper subject-verb agreement and verb forms in English sentences.

Formula / Reasoning
The correct option must use the proper auxiliary verb with the correct form of the main verb that agrees with the subject.

Step-by-Step Solution
1. The subject ''She'' requires the use of ''does'' for negation, making ''doesn''t'' the correct auxiliary verb. 
2. The main verb ''like'' must remain in its base form after ''doesn''t''. 
3. The first option uses ''don''t'', which is incorrect for singular subjects. 
4. The second option incorrectly uses ''likes'', which is not needed after ''doesn''t''. 
5. The last option uses ''not'' incorrectly, lacking the auxiliary verb ''does''. 
Therefore, the only correct option is ''She doesn''t like going to the gym.''

Final Answer
The final answer is: She doesn''t like going to the gym.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:05:37.787', '2026-08-26 05:01:56.045', '{"options": ["The team is working on their project.", "The team works on their project is.", "The team are working on their project.", "The team working on their project."]}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team is working on their project.", "The team works on their project is.", "The team are working on their project.", "The team working on their project."], "correctAnswer": "The team is working on their project."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40sj3s001q7gggrlc2hd9d', 'Identify the grammatically correct statement regarding the project''s milestones.', 'The project''s milestones include several key phases.', 'Concept

The concept being tested is proper verb agreement with plural nouns.

Formula / Reasoning

When the subject of a sentence is plural, the verb must agree in number and be in the correct form.

Step-by-Step Solution

1. The subject ''milestones'' is plural, therefore it requires a plural verb.
2. ''Includes'' is singular and does not agree with ''milestones''.
3. ''Are include'' is incorrect because ''are'' is plural but ''include'' does not follow the correct form. 
4. ''Is include'' is incorrect as ''is'' is singular and does not match the plural subject.
5. The correct option ''include'' correctly pairs with the plural subject ''milestones''.

Final Answer
The final answer is: The project''s milestones include several key phases.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:33.688', '2026-08-26 05:03:37.83', '{"options": ["The project''s milestones includes several key phases.", "The project''s milestones include several key phases.", "The project''s milestones is include several key phases.", "The project''s milestones are include several key phases."], "_generatedQuestionId": "cmt3ygk5f000qs8z195nts8zy"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The project''s milestones includes several key phases.", "The project''s milestones include several key phases.", "The project''s milestones is include several key phases.", "The project''s milestones are include several key phases."], "correctAnswer": "The project''s milestones include several key phases."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40savq001k7gggg08x7fgv', 'Identify the grammatically correct version of the following sentence regarding project updates.', 'The team completed their updates on the project last week.', 'Concept

The concept tested here is subject-verb agreement and proper tense usage in sentences.

Formula / Reasoning

The correct sentence uses the past tense verb form to indicate that the action was completed last week, matching the time reference.

Step-by-Step Solution

1. Analyze the subject: ''The team'' is treated as a singular collective noun in American English, hence the verb should align accordingly if singular or plural. 
2. The phrase ''completed their updates on the project last week'' properly uses the simple past tense, indicating the action is finished with a clear time marker (''last week''). 
3. The distractors either misuse verb forms or subject-verb agreement. ''Has completed'' suggests a present perfect tense, which indicates a connection to the present but conflicts with the past time reference given.
4. The options that use ''has'' or ''have'' incorrectly change the intended meaning or grammatical structure.

Final Answer
The final answer is clearly: The team completed their updates on the project last week.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:23.031', '2026-08-26 05:03:37.83', '{"options": ["The team has completed their updates on the project last week.", "The team has completed its updates on the project last week.", "The team completed their updates on the project last week.", "The team have completed their updates on the project last week."], "_generatedQuestionId": "cmt40c4l90004rncom1e87sv9"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team has completed their updates on the project last week.", "The team has completed its updates on the project last week.", "The team completed their updates on the project last week.", "The team have completed their updates on the project last week."], "correctAnswer": "The team completed their updates on the project last week."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x2vbv003snhc3g0udax1f', 'Identify the proper sentence structure.', 'She enjoys reading novels.', 'Concept
This question tests knowledge of correct verb forms and gerund usage in English.

Formula / Reasoning
The verb ''enjoy'' is always followed by a gerund (the -ing form of a verb), and the subject must agree with the verb in number and person.

Step-by-Step Solution
1. The sentence ''She enjoys to read novels.'' is incorrect because ''enjoy'' should be followed by a gerund, not an infinitive.
2. ''She enjoys reading novels.'' is correct since ''reading'' is a gerund that appropriately follows ''enjoy''.
3. ''She enjoy reading novels.'' is incorrect because the verb ''enjoy'' does not agree with the singular subject ''She''. It should be ''enjoys''.
4. ''She enjoy to read novels.'' is incorrect for the same reason as the first option; it uses the infinitive instead of a gerund and also lacks subject-verb agreement.

Final Answer
The final answer is ''She enjoys reading novels.''.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:07:37.628', '2026-08-26 05:03:37.83', '{"options": ["She enjoy to read novels.", "She enjoys to read novels.", "She enjoy reading novels.", "She enjoys reading novels."], "_generatedQuestionId": "cmt3wnxze0010nhc3tcdw4xpq"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["She enjoy to read novels.", "She enjoys to read novels.", "She enjoy reading novels.", "She enjoys reading novels."], "correctAnswer": "She enjoys reading novels."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt4126xn003f7ggg0293tidc', 'Identify the sentence that demonstrates proper grammatical structure.', 'He enjoys going to the park on weekends.', 'Concept

This question tests the ability to recognize correct grammatical construction in English sentences.

Formula / Reasoning

The correct sentence must maintain subject-verb agreement and proper tense. In English, singular subjects require plural verbs and vice versa.

Step-by-Step Solution

1. The correct option is ''He enjoys going to the park on weekends,'' which uses the singular verb ''enjoys'' with the singular subject ''He.''.
2. The option ''He enjoy going to the park on weekends.'' incorrectly uses ''enjoy'' instead of ''enjoys,'' violating subject-verb agreement.
3. ''He enjoying going to the park on weekends.'' is incorrect as it uses the present participle ''enjoying'' without an auxiliary verb.
4. ''He go to the park on weekend.'' is incorrect because ''go'' should be ''goes'' to agree with the singular subject, and ''weekend'' should be plural form ''weekends'' when referring to multiple instances.

Final Answer
The final answer is ''He enjoys going to the park on weekends.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:59:04.475', '2026-08-26 05:03:37.83', '{"options": ["He enjoy going to the park on weekends.", "He go to the park on weekend.", "He enjoys going to the park on weekends.", "He enjoying going to the park on weekends."], "_generatedQuestionId": "cmt40ydg500227gggx8c4l1w1"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["He enjoy going to the park on weekends.", "He go to the park on weekend.", "He enjoys going to the park on weekends.", "He enjoying going to the park on weekends."], "correctAnswer": "He enjoys going to the park on weekends."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt411eyf002z7gggs3qqc6nn', 'Identify the sentence that is correctly structured based on standard English grammar.', 'The team will meet the client tomorrow.', 'Concept

This question tests knowledge of correct verb forms and sentence structure in English.

Formula / Reasoning

The correct sentence uses the simple future tense ''will meet'' correctly, while the other options either misuse verb forms or create sentence fragments.

Step-by-Step Solution

1. ''The team will meeting the client tomorrow.'' - Incorrect verb form; ''meeting'' should be ''meet''.
2. ''The team will meet the client tomorrow.'' - Correct tense and structure; this is the accurate option.
3. ''The team meets the client tomorrow to discuss.'' - While it uses a correct verb form, it alters the intended meaning by suggesting a habitual action rather than a scheduled future action.
4. ''The team meeting with the client tomorrow.'' - This is a fragment and lacks a main verb.

Final Answer
The final answer is clearly option: The team will meet the client tomorrow.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:58:28.215', '2026-08-26 05:03:37.83', '{"options": ["The team meets the client tomorrow to discuss.", "The team will meeting the client tomorrow.", "The team will meet the client tomorrow.", "The team meeting with the client tomorrow."], "_generatedQuestionId": "cmt410rse002x7ggg6vfuvdww"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team meets the client tomorrow to discuss.", "The team will meeting the client tomorrow.", "The team will meet the client tomorrow.", "The team meeting with the client tomorrow."], "correctAnswer": "The team will meet the client tomorrow."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40rzye001c7gggvdk6d0yz', 'Identify the sentence that is free from grammatical errors.', 'Each of the team members has submitted their reports on time.', 'Concept
This question tests the knowledge of subject-verb agreement and proper use of singular and plural forms in sentences.

Formula / Reasoning
The correct form requires matching the singular subject ''Each'' with the singular verb form ''has'' and ensuring the plural noun ''members'' aligns with its corresponding plural noun ''reports''.

Step-by-Step Solution
1. The subject ''Each'' is singular, so it should be paired with ''has'' instead of ''have''.
2. ''Members'' is plural, but it is correctly paired with ''reports'', which is also plural in the correct option.
3. The phrase ''on time'' is the correct usage instead of ''timely''.
4. The options ''Each of the team member'' and ''Each team member'' incorrectly use ''have''.

Final Answer
The correct answer is: Each of the team members has submitted their reports on time.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:08.87', '2026-08-26 05:03:37.83', '{"options": ["Each of the team members have submitted their reports timely.", "Each of the team members has submitted their reports on time.", "Each of the team member has submitted their report on time.", "Each team member have submitted their report timely."], "_generatedQuestionId": "cmt40n1t0000e7gggj5xn7zea"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Each of the team members have submitted their reports timely.", "Each of the team members has submitted their reports on time.", "Each of the team member has submitted their report on time.", "Each team member have submitted their report timely."], "correctAnswer": "Each of the team members has submitted their reports on time."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt412co3003h7gggy40ycb7k', 'Identify the sentence that is grammatically accurate among the following options.', 'Neither John nor his colleagues are ready for the presentation.', 'Concept

The question tests knowledge of subject-verb agreement with compound subjects using ''neither...nor''.

Formula / Reasoning

When using ''neither...nor'', the verb should agree with the nearest subject, which in this case is ''colleagues'' (plural).

Step-by-Step Solution

1. Analyze the subjects in each option: ''John'' (singular) and ''his colleagues'' (plural).
2. In ''Neither John nor his colleagues are ready for the presentation.'', ''are'' correctly agrees with the plural ''colleagues''.
3. In the other options, either the verb does not agree with ''colleagues'' or the structure is incorrect, making them grammatically incorrect.
4. Therefore, the correct sentence is the one where the plural subject is paired with the correct form of the verb.

Final Answer
The final answer is: ''Neither John nor his colleagues are ready for the presentation.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:59:11.907', '2026-08-26 05:03:37.83', '{"options": ["Neither John nor his colleagues is ready for the presentation.", "Neither John and his colleagues is ready for the presentation.", "Neither John nor his colleague is ready for the presentation.", "Neither John nor his colleagues are ready for the presentation."], "_generatedQuestionId": "cmt40wu95001y7gggqufw91pp"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Neither John nor his colleagues is ready for the presentation.", "Neither John and his colleagues is ready for the presentation.", "Neither John nor his colleague is ready for the presentation.", "Neither John nor his colleagues are ready for the presentation."], "correctAnswer": "Neither John nor his colleagues are ready for the presentation."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x2ot7003qnhc3rwnyjfn5', 'Identify the sentence that is grammatically correct.', 'The team is preparing for the presentation.', 'Concept

The concept being tested is grammatical correctness in sentence structure, particularly the proper use of gerunds and infinitives.

Formula / Reasoning

The verb ''enjoy'' is always followed by a gerund, not an infinitive. Thus, the correct form is ''enjoys reading'' instead of ''enjoys to read''.

Step-by-Step Solution
1. Analyze each option for verb and gerund/infinitive usage.
2. ''She enjoys to read books.'' - incorrect because ''enjoys'' should be followed by a gerund.
3. ''She enjoys reading books.'' - correct because it uses the gerund form.
4. ''She enjoy reading books.'' - incorrect due to subject-verb agreement; it should be ''enjoys''.
5. ''She enjoy to read books.'' - incorrect for the same reason as the first option. 

Final Answer
The correct answer is ''She enjoys reading books.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:07:29.179', '2026-08-26 05:03:37.83', '{"options": ["The team is preparing for the presentation.", "The teams is preparing for the presentation.", "The team are preparing for the presentation.", "The teams are preparing for the presentation."]}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team is preparing for the presentation.", "The teams is preparing for the presentation.", "The team are preparing for the presentation.", "The teams are preparing for the presentation."], "correctAnswer": "The team is preparing for the presentation."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40sksa001s7gggs3dybiut', 'Identify the sentence with correct subject-verb agreement.', 'The committee meets every week.', 'Concept
This question tests the understanding of subject-verb agreement, which is essential for grammatical accuracy in writing.

Formula / Reasoning
The subject must agree in number with its verb. Collective nouns like ''team'', ''group'', and ''pair'' can be singular or plural based on context, while ''committee'' is treated as singular in this context.

Step-by-Step Solution
1. ''The team of engineers were working late.'' - ''team'' is a collective noun and should take ''was'', not ''were''.
2. ''The group of managers are meeting tomorrow.'' - ''group'' is singular, so it should take ''is''.
3. ''The committee meets every week.'' - ''committee'' is singular, and ''meets'' is correctly used.
4. ''The pair of shoes were on sale.'' - ''pair'' is singular and should take ''was''.

Final Answer
The final answer is clearly option C: The committee meets every week.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:35.866', '2026-08-26 05:03:37.83', '{"options": ["The group of managers are meeting tomorrow.", "The committee meets every week.", "The team of engineers were working late.", "The pair of shoes were on sale."], "_generatedQuestionId": "cmt3ygeor000ns8z1g2tnzb7z"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The group of managers are meeting tomorrow.", "The committee meets every week.", "The team of engineers were working late.", "The pair of shoes were on sale."], "correctAnswer": "The committee meets every week."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x0upq0038nhc3cvp4rmtu', 'Select the accurately phrased statement regarding the project timeline.', 'The project is expected to be completed in two weeks.', 'Concept

The concept being tested is correct sentence structure regarding future completions and the use of passive voice.

Formula / Reasoning

The correct structure for indicating an expected completion involves using the passive form ''to be completed'' rather than ''to complete''.

Step-by-Step Solution

1. Option A states ''to complete'' which incorrectly uses the active voice for a future expectation. 
2. Option B uses ''to be completed'', which correctly employs the passive voice and indicates the expected timeline. 
3. Option C incorrectly uses ''to be completing'', which is not a standard form for this context. 
4. Option D incorrectly uses ''to complete for'', which does not convey the intended meaning.

Final Answer
The final answer is clearly option B: The project is expected to be completed in two weeks.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:06:03.518', '2026-08-26 05:03:37.83', '{"options": ["The project is expected to be completed in two weeks.", "The project is expected to complete for two weeks.", "The project is expected to be completing in two weeks.", "The project is expected to complete in two weeks."], "_generatedQuestionId": "cmt3wulp1001znhc35cn3f9ro"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The project is expected to be completed in two weeks.", "The project is expected to complete for two weeks.", "The project is expected to be completing in two weeks.", "The project is expected to complete in two weeks."], "correctAnswer": "The project is expected to be completed in two weeks."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x24xr003knhc3c52h3k1l', 'Select the correct sentence regarding project deadlines.', 'The report is due next Friday.', 'Concept
The concept being tested is sentence correction, specifically the proper use of singular and plural forms as well as possessive cases.

Formula / Reasoning
In English, the term ''Friday'' is singular when referring to one specific day, and the structure must agree with the subject.

Step-by-Step Solution
1. Option A uses ''next Friday'' correctly as a singular reference to an upcoming deadline, making it correct.
2. Option B incorrectly uses ''Fridays'' in plural, which does not fit the context of a single due date.
3. Option C uses ''are'' instead of ''is'', which creates a subject-verb agreement error since ''report'' is singular.
4. Option D incorrectly adds a possessive form ''Friday''s'', which is not necessary in this context.

Final Answer
The final answer is clearly Option A: ''The report is due next Friday.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:07:03.423', '2026-08-26 05:03:37.83', '{"options": ["The report is due next Friday.", "The report are due next Friday.", "The report is due next Friday''s.", "The report is due next Fridays."], "_generatedQuestionId": "cmt3wp5vf001cnhc39hohlpfb"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The report is due next Friday.", "The report are due next Friday.", "The report is due next Friday''s.", "The report is due next Fridays."], "correctAnswer": "The report is due next Friday."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x31zq003unhc308jsxu1k', 'Select the correct statement regarding project deadlines.', 'The report is due next week.', 'Concept
This question tests the understanding of correct prepositional usage in English.

Formula / Reasoning
The correct preposition for indicating a time frame is ''due next week'' without an additional preposition.

Step-by-Step Solution
1. Option A states ''The report is due next week.'' This is correct usage, as it indicates a time without unnecessary prepositions.
2. Option B states ''The report is due in next week.'' The preposition ''in'' is incorrect here; it should not precede ''next week.''
3. Option C states ''The report is due at next week.'' The preposition ''at'' does not fit with ''next week.''
4. Option D states ''The report is due on next week.'' The preposition ''on'' is also incorrect as ''next week'' is not a specific day. 

Final Answer
The correct option is A: ''The report is due next week.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:07:46.262', '2026-08-26 05:03:37.83', '{"options": ["The report is due next week.", "The report is due on next week.", "The report is due at next week.", "The report is due in next week."], "_generatedQuestionId": "cmt3wnn9d000xnhc3nj7z1wyf"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The report is due next week.", "The report is due on next week.", "The report is due at next week.", "The report is due in next week."], "correctAnswer": "The report is due next week."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x3f6i003ynhc3pv3dxqfn', 'Select the correct statement regarding the project deadlines.', 'The deadlines for the projects are very tight.', 'Concept
The question assesses the ability to identify correct subject-verb agreement in sentences.

Formula / Reasoning
In English, plural subjects require plural verbs. Here, ''deadlines'' is plural, so it should match with ''are''.

Step-by-Step Solution
1. The subject ''deadlines'' is plural, meaning it needs a plural verb. 
2. Option A uses ''is'', which is singular and incorrect. 
3. Option C incorrectly pairs ''deadline'' (singular) with ''are'' (plural). 
4. Option D wrongly uses ''are'' with ''project'' (singular). 
5. Option B correctly states ''The deadlines for the projects are very tight.'', matching plural subject with plural verb.

Final Answer
The final answer is clearly option B: ''The deadlines for the projects are very tight.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:08:03.354', '2026-08-26 05:03:37.83', '{"options": ["The deadlines for the projects is very tight.", "The deadline for the projects are very tight.", "The deadlines for the projects are very tight.", "The deadline for the project are very tight."], "_generatedQuestionId": "cmt3wn1qa000rnhc3arz8tcgn"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The deadlines for the projects is very tight.", "The deadline for the projects are very tight.", "The deadlines for the projects are very tight.", "The deadline for the project are very tight."], "correctAnswer": "The deadlines for the projects are very tight."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x462p0046nhc3w7gjavvz', 'Select the correct statement regarding the team''s project submissions.', 'All the team members submit their reports on time.', 'Concept

The concept being tested is subject-verb agreement in sentences.

Formula / Reasoning

In English, when the subject is plural, the verb must also be in the plural form. The phrase ''team members'' is plural and requires the plural form of the verb ''submit''.

Step-by-Step Solution

1. The phrase ''All the team members'' is the subject and is plural.
2. Therefore, the verb should be in the plural form, which is ''submit'' rather than ''submits''.
3. The correct choice ''All the team members submit their reports on time.'' maintains proper subject-verb agreement.
4. The other options either use incorrect verb forms or lack pluralization, making them incorrect.

Final Answer
The final answer is clearly option B: ''All the team members submit their reports on time.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:08:38.21', '2026-08-26 05:03:37.83', '{"options": ["All the team members submit their reports on time.", "All team member submit their reports on time.", "All the team members submits their reports on time.", "Each of the team members submit their report on time."], "_generatedQuestionId": "cmt3wdbq5000bnhc3h92khkhh"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["All the team members submit their reports on time.", "All team member submit their reports on time.", "All the team members submits their reports on time.", "Each of the team members submit their report on time."], "correctAnswer": "All the team members submit their reports on time."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x45jo0044nhc37d870ofg', 'Select the correct statement regarding the team''s project submissions.', 'All the team members submit their reports on time.', 'Concept

The concept being tested is subject-verb agreement in sentences.

Formula / Reasoning

In English, when the subject is plural, the verb must also be in the plural form. The phrase ''team members'' is plural and requires the plural form of the verb ''submit''.

Step-by-Step Solution

1. The phrase ''All the team members'' is the subject and is plural.
2. Therefore, the verb should be in the plural form, which is ''submit'' rather than ''submits''.
3. The correct choice ''All the team members submit their reports on time.'' maintains proper subject-verb agreement.
4. The other options either use incorrect verb forms or lack pluralization, making them incorrect.

Final Answer
The final answer is clearly option B: ''All the team members submit their reports on time.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:08:37.525', '2026-08-26 05:03:37.83', '{"options": ["All the team members submit their reports on time.", "All team member submit their reports on time.", "All the team members submits their reports on time.", "Each of the team members submit their report on time."], "_generatedQuestionId": "cmt3wdbq5000bnhc3h92khkhh"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["All the team members submit their reports on time.", "All team member submit their reports on time.", "All the team members submits their reports on time.", "Each of the team members submit their report on time."], "correctAnswer": "All the team members submit their reports on time."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3wzr5p002ynhc3g70unfha', 'Select the correct version of the following sentence: ''The team of engineers have completed the project.''', 'The team of engineers has completed the project.', 'Concept
The concept being tested here is subject-verb agreement in English grammar.

Formula / Reasoning
The subject ''team'' is a collective noun that is singular, hence it takes the singular verb ''has'' rather than the plural ''have''.

Step-by-Step Solution
1. The subject ''team'' is singular, so the correct verb form should agree with it. 
2. ''Has'' is the correct singular form of the verb that should be used with ''team''. 
3. The other options use ''have'', which is incorrect in this context. 
4. The option ''The teams of engineers has completed the project.'' also incorrectly treats ''teams'' as singular, which is not appropriate here. 

Final Answer
The final answer is clearly option A: ''The team of engineers has completed the project.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:05:12.253', '2026-08-26 05:03:37.83', '{"options": ["The team of engineers have completed the project.", "The teams of engineers has completed the project.", "The team of engineer have completed the project.", "The team of engineers has completed the project."], "_generatedQuestionId": "cmt3wwg0c002hnhc3pppmfqbj"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team of engineers have completed the project.", "The teams of engineers has completed the project.", "The team of engineer have completed the project.", "The team of engineers has completed the project."], "correctAnswer": "The team of engineers has completed the project."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40rs6800147ggg67jww50u', 'Select the correctly structured sentence from the following options.', 'Neither the manager nor the employees were satisfied with the new policies.', 'Concept
The concept being tested is the correct subject-verb agreement in compound subjects.

Formula / Reasoning
In sentences where ''neither...nor'' is used, the verb should agree with the nearest subject, which in this case is ''employees'' (plural).

Step-by-Step Solution
1. Analyze the compound subject: ''Neither the manager nor the employees''. Here, ''employees'' is plural. 
2. Identify the verb: The correct form should be ''were'' to match the plural subject. 
3. Assess alternatives: ''was'' in options A and D is incorrect due to singular verb form, and ''or'' in option C is incorrect as it should be ''nor''. 
4. Therefore, option B correctly uses ''were'' to match the plural subject, making it the only correct choice.

Final Answer
The final answer is option B: ''Neither the manager nor the employees were satisfied with the new policies.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:50:58.784', '2026-08-26 05:03:37.83', '{"options": ["Neither the manager nor the employees was satisfied with the new policies.", "Neither the manager nor the employees was satisfy with the new policies.", "Neither the manager nor the employees were satisfied with the new policies.", "Neither were the manager or the employees satisfied with the new policies."], "_generatedQuestionId": "cmt40ochw000s7gggnke5c3rv"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Neither the manager nor the employees was satisfied with the new policies.", "Neither the manager nor the employees was satisfy with the new policies.", "Neither the manager nor the employees were satisfied with the new policies.", "Neither were the manager or the employees satisfied with the new policies."], "correctAnswer": "Neither the manager nor the employees were satisfied with the new policies."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3ycma8000fs8z1mb1reypg', 'Select the correctly structured sentence regarding the company''s performance.', 'The team achieved the targets on time for the review.', 'Concept

This question assesses the understanding of proper phrases used to indicate punctuality in a professional context.

Formula / Reasoning

The phrase ''on time'' indicates that something was completed at the scheduled or expected time. This is the standard expression used in business contexts.

Step-by-Step Solution

1. Analyze the options for grammatical correctness and idiomatic usage.
2. ''In time'' suggests early completion, but does not directly fit in this context. ''At time'' and ''by time'' are not standard phrases used in this context.
3. ''On time'' is the correct expression indicating that the targets were met as scheduled.
4. Therefore, the correct option is the one that uses ''on time'' appropriately.

Final Answer
The final answer is clearly option B: ''The team achieved the targets on time for the review.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:12.08', '2026-08-26 05:03:37.83', '{"options": ["The team achieved the targets on time for the review.", "The team achieved the targets at time for the review.", "The team achieved the targets in time for the review.", "The team achieved the targets by time for the review."], "_generatedQuestionId": "cmt3xkx7i004unhc3o9w797vi"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team achieved the targets on time for the review.", "The team achieved the targets at time for the review.", "The team achieved the targets in time for the review.", "The team achieved the targets by time for the review."], "correctAnswer": "The team achieved the targets on time for the review."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x17wc003cnhc3c0kja3ez', 'Select the correctly structured sentence.', 'The manager doesn''t approve the proposal.', 'Concept
This question tests the correct usage of subject-verb agreement in English sentences.

Formula / Reasoning
The correct form after ''doesn''t'' should use the base form of the verb, which is ''approve'' in this case.

Step-by-Step Solution
1. The phrase ''doesn''t'' indicates that the verb must be in its base form. ''Approve'' is the correct base form. 
2. ''The manager don''t approve the proposal.'' is incorrect because ''don''t'' should be ''doesn''t'' for singular subjects. 
3. ''The manager doesn''t approves the proposal.'' is incorrect because ''approves'' is not the base form and should be ''approve''. 
4. ''The manager not approve the proposal.'' is incorrect due to the missing auxiliary verb ''does''. 
Therefore, the only correct option is ''The manager doesn''t approve the proposal.''.

Final Answer
The final answer is: The manager doesn''t approve the proposal.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:06:20.604', '2026-08-26 05:03:37.83', '{"options": ["The manager not approve the proposal.", "The manager doesn''t approves the proposal.", "The manager doesn''t approve the proposal.", "The manager don''t approve the proposal."], "_generatedQuestionId": "cmt3wqqoj001rnhc3xvuyp5sc"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The manager not approve the proposal.", "The manager doesn''t approves the proposal.", "The manager doesn''t approve the proposal.", "The manager don''t approve the proposal."], "correctAnswer": "The manager doesn''t approve the proposal."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3ycpth000js8z1ixocem8c', 'Select the grammatically correct option regarding the proposal made by the team lead.', 'The team lead recommended that the project manager complete the report.', 'Concept
This question tests the understanding of subjunctive mood usage in English grammar.

Formula / Reasoning
In English, after verbs like ''recommend,'' the subjunctive form is used, which requires the base form of the verb.

Step-by-Step Solution
1. The verb ''recommended'' indicates a suggestion, which typically requires the subjunctive mood.
2. The correct structure following ''recommended that'' is to use the base form of the verb ''complete.''
3. Options A and D incorrectly use ''completes'' and ''completing,'' which do not follow the subjunctive form.
4. Option C incorrectly suggests ''the project manager to complete'' which is not standard in this context.

Final Answer
The final answer is clearly option B: The team lead recommended that the project manager complete the report.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:16.661', '2026-08-26 05:03:37.83', '{"options": ["The team lead recommended the project manager to complete the report.", "The team lead recommended that the project manager complete the report.", "The team lead recommended the project manager completing the report.", "The team lead recommended that the project manager completes the report."], "_generatedQuestionId": "cmt3xdr30004mnhc3cozwllvo"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team lead recommended the project manager to complete the report.", "The team lead recommended that the project manager complete the report.", "The team lead recommended the project manager completing the report.", "The team lead recommended that the project manager completes the report."], "correctAnswer": "The team lead recommended that the project manager complete the report."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x1l34003gnhc3zle25wob', 'Select the grammatically correct request.', 'Could you please help me with this task?', 'Concept
This question tests the ability to identify the grammatically correct sentence structure in a request.

Formula / Reasoning
The correct form of a request should use the base form of the verb following ''could'' or ''can'', and should ensure that nouns are pluralized correctly if needed.

Step-by-Step Solution
1. The first option, ''Could you please help me with this task?'', is correct as it uses the appropriate verb form ''help'' after ''could''.
2. The second option, ''Can you helps me with this task?'', is incorrect because ''helps'' is the wrong form; it should be ''help''.
3. The third option, ''Could you please helping me with this task?'', is incorrect as ''helping'' is not the correct verb form after ''could''.
4. The fourth option, ''Can you help me with this tasks?'', is incorrect because ''tasks'' should be singular to match ''this''.

Final Answer
The final answer is clearly option A: ''Could you please help me with this task?''.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:06:37.697', '2026-08-26 05:03:37.83', '{"options": ["Can you helps me with this task?", "Could you please helping me with this task?", "Could you please help me with this task?", "Can you help me with this tasks?"], "_generatedQuestionId": "cmt3wq5ac001lnhc3727pf141"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Can you helps me with this task?", "Could you please helping me with this task?", "Could you please help me with this task?", "Can you help me with this tasks?"], "correctAnswer": "Could you please help me with this task?"}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40ruwj00167gggz3al39ww', 'Select the grammatically correct sentence from the following options.', 'If she had known about the meeting, she could have attended.', 'Concept
This question tests the understanding of subject-verb agreement in compound subjects.

Formula / Reasoning
In English grammar, when using ''neither/nor'', the verb should agree with the part of the subject closest to it. In this case, ''employees'' is plural, hence the verb should be ''were''.

Step-by-Step Solution
1. In option A, the subject is ''manager'' (singular) and ''employees'' (plural), but the verb ''was'' is incorrectly used instead of ''were''.
2. In option B, ''managers'' (plural) and ''employee'' (singular) are mismatched with the verb ''were''.
3. In option C, the structure correctly aligns with the plural noun ''employees'' and uses ''were'' correctly.
4. In option D, ''managers'' (plural) is incorrectly matched with the singular verb ''was''.

Final Answer
The correct answer is C: ''Neither the manager nor the employees were informed about the changes.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:02.324', '2026-08-26 05:03:37.83', '{"options": ["If she had known about the meeting, she could have attended.", "If she knew about the meeting, she could have been able to attend.", "If she had knew about the meeting, she could have attended.", "If she would have known about the meeting, she could attend."]}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["If she had known about the meeting, she could have attended.", "If she knew about the meeting, she could have been able to attend.", "If she had knew about the meeting, she could have attended.", "If she would have known about the meeting, she could attend."], "correctAnswer": "If she had known about the meeting, she could have attended."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x0hiw0036nhc3yp0ik46o', 'Select the grammatically correct sentence from the options below.', 'She enjoys reading mystery novels.', 'Concept
The question tests the correct use of articles in English grammar.

Formula / Reasoning
The article ''an'' is used before words that begin with a vowel sound, including ''engineer''.

Step-by-Step Solution
1. Option A, ''She is a engineer.'', is incorrect because ''engineer'' begins with a vowel sound, requiring ''an'' instead of ''a''.
2. Option B, ''She is an engineer.'', is correct as it appropriately uses ''an'' before ''engineer''.
3. Option C, ''She is the engineer.'', is grammatically correct but contextually different; it implies she is a specific engineer, not just any engineer.
4. Option D, ''She is engineer an.'', is incorrect as the structure of the sentence is reversed, making it nonsensical.

Final Answer
The correct option is B: She is an engineer.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:05:46.424', '2026-08-26 05:03:37.83', '{"options": ["She enjoys reading mystery novels.", "She enjoy reading mystery novels.", "She enjoy to read mystery novels.", "She enjoys to read mystery novels."]}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["She enjoys reading mystery novels.", "She enjoy reading mystery novels.", "She enjoy to read mystery novels.", "She enjoys to read mystery novels."], "correctAnswer": "She enjoys reading mystery novels."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40sff1001m7gggw27622q5', 'Select the grammatically correct sentence regarding the company''s future policy changes.', 'Should the company revise its policy, several employees might raise concerns.', 'Concept
This question tests the ability to recognize correct conditional sentence structures in English.

Formula / Reasoning
The correct form for a conditional sentence using ''should'' requires the base form of the verb following ''should''.

Step-by-Step Solution
1. The first option incorrectly includes ''to'' after ''should'', making it grammatically incorrect. 
2. The second option correctly uses the base form ''revise'' after ''should'', making it the correct answer. 
3. The third option incorrectly alters ''revise'' to ''revised'', which is not the correct tense for this structure. 
4. The fourth option incorrectly uses ''revising'', which is not appropriate after ''should''.

Final Answer
The correct option is: Should the company revise its policy, several employees might raise concerns.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:28.909', '2026-08-26 05:03:37.83', '{"options": ["Should the company revise its policy, several employees might raise concerns.", "Should the company to revise its policy, several employees might raise concerns.", "Should the company revising its policy, several employees might raise concerns.", "Should the company revised its policy, several employees might raise concerns."], "_generatedQuestionId": "cmt3ywetc0013s8z1qpi0trs6"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Should the company revise its policy, several employees might raise concerns.", "Should the company to revise its policy, several employees might raise concerns.", "Should the company revising its policy, several employees might raise concerns.", "Should the company revised its policy, several employees might raise concerns."], "correctAnswer": "Should the company revise its policy, several employees might raise concerns."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3ycja5000bs8z17og0cql5', 'Select the grammatically correct sentence regarding the meeting schedule.', 'The manager informed us when the meeting starts.', 'Concept
The question tests the understanding of indirect questions and their structure.

Formula / Reasoning
In indirect questions, the word order resembles that of a statement rather than a question. The correct option maintains this structure.

Step-by-Step Solution
1. Option A is correct as it maintains the statement structure: ''when the meeting starts.''
2. Option B is incorrect because it uses the question format ''when does the meeting start?'' which is not suitable for an indirect question.
3. Option C is incorrect as it uses past tense ''started,'' which changes the intended meaning.
4. Option D is incorrect due to the awkward placement of ''us'' which disrupts the sentence structure.

Final Answer
The final answer is clearly option A: The manager informed us when the meeting starts.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:08.189', '2026-08-26 05:03:37.83', '{"options": ["The manager informed us when the meeting starts.", "The manager informed us when does the meeting start.", "The manager informed us when the meeting started.", "The manager informed when the meeting starts us."], "_generatedQuestionId": "cmt3xlnm70050nhc3hkmsnqi2"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The manager informed us when the meeting starts.", "The manager informed us when does the meeting start.", "The manager informed us when the meeting started.", "The manager informed when the meeting starts us."], "correctAnswer": "The manager informed us when the meeting starts."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3ycktt000ds8z1q3pbuies', 'Select the grammatically correct sentence regarding the project completion.', 'The committee has reached its decision.', 'Concept
The concept being tested is subject-verb agreement in sentences where collective nouns are used.

Formula / Reasoning
In English grammar, collective nouns like ''committee'' are often treated as singular when referring to the group as a whole, requiring a singular verb form.

Step-by-Step Solution
1. The subject here is ''committee'', which is a collective noun. When referring to the committee as a single entity, we use ''has''.
2. Option 1 uses ''have'', which is incorrect as it should be ''has''.
3. Option 3 uses ''their decisions'', which is incorrect because ''decision'' should be singular to match the singular verb ''has''.
4. Option 4 repeats the error of using ''have'' instead of ''has''. 
Therefore, the only correct option is ''The committee has reached its decision.''

Final Answer
The final answer is option B: The committee has reached its decision.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:10.192', '2026-08-26 05:03:37.83', '{"options": ["The committee have reached their decision.", "The committee have reached its decision.", "The committee has reached its decision.", "The committee has reached their decisions."], "_generatedQuestionId": "cmt3xlc6c004xnhc3qvyn567v"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The committee have reached their decision.", "The committee have reached its decision.", "The committee has reached its decision.", "The committee has reached their decisions."], "correctAnswer": "The committee has reached its decision."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3wz79b002snhc3bllvpit6', 'Select the grammatically correct sentence regarding the project team.', 'The project manager was late to the meeting.', 'Concept
The question tests sentence correction focusing on subject-verb agreement.

Formula / Reasoning
The subject must agree in number with the verb; singular subjects take singular verbs.

Step-by-Step Solution
1. ''The project managers was late to the meeting.'' - Incorrect because ''managers'' is plural and should use ''were''.
2. ''The project managers are late to the meeting.'' - Correct for plural subject but does not match the context of being ''late'' at a specific time.
3. ''The project manager were late to the meeting.'' - Incorrect because ''manager'' is singular but uses the plural verb ''were''.
4. ''The project manager was late to the meeting.'' - Correct as ''manager'' is singular and appropriately uses ''was''.

Final Answer
The final answer is: The project manager was late to the meeting.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:04:46.463', '2026-08-26 05:03:37.83', '{"options": ["The project managers are late to the meeting.", "The project managers was late to the meeting.", "The project manager was late to the meeting.", "The project manager were late to the meeting."], "_generatedQuestionId": "cmt3wxesc002qnhc3y1ssm6ir"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The project managers are late to the meeting.", "The project managers was late to the meeting.", "The project manager was late to the meeting.", "The project manager were late to the meeting."], "correctAnswer": "The project manager was late to the meeting."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x1yf3003inhc37zslhmk7', 'Select the grammatically correct sentence.', 'The manager and I discussed the project.', 'Concept
The question tests knowledge of correct pronoun usage in sentences.

Formula / Reasoning
The correct pronoun to use as the subject of a sentence is ''I'', not ''me'', hence ''The manager and I'' is the correct phrase.

Step-by-Step Solution
1. The subject of a sentence must be in the nominative case. ''I'' is the correct nominative form, while ''me'' is accusative.
2. In the options, ''The manager and I discussed the project.'' correctly uses ''I'' as part of the compound subject.
3. ''The manager and me discussed the project.'' and ''Me and the manager discussed the project.'' incorrectly use ''me'' in the subject position.
4. ''I and the manager discussed the project.'' is grammatically correct but less commonly used than the preferred structure.

Final Answer
The final answer is clearly option A: ''The manager and I discussed the project.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:06:54.787', '2026-08-26 05:03:37.83', '{"options": ["Me and the manager discussed the project.", "The manager and I discussed the project.", "I and the manager discussed the project.", "The manager and me discussed the project."], "_generatedQuestionId": "cmt3wphn8001fnhc3znvgetvj"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Me and the manager discussed the project.", "The manager and I discussed the project.", "I and the manager discussed the project.", "The manager and me discussed the project."], "correctAnswer": "The manager and I discussed the project."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt411vzw00377gggmh300k4a', 'Select the grammatically correct statement regarding the project report submission.', 'The team submitted the report yesterday.', 'Concept

This question tests the proper use of verb tenses in a sentence.

Formula / Reasoning

The correct answer should reflect a past action. Hence, the past tense verb is required to indicate when the action occurred.

Step-by-Step Solution

1. ''The team has submitted the report yesterday.'' - Incorrect because ''has submitted'' (present perfect) cannot be paired with a specific past time (''yesterday'').
2. ''The team submits the report yesterday.'' - Incorrect as ''submits'' (present tense) cannot refer to a past event like ''yesterday''.
3. ''The team submitted the report yesterday.'' - Correct as ''submitted'' is in the past tense, aligning with the time frame.
4. ''The team was submitting the report yesterday.'' - Incorrect because ''was submitting'' (past continuous) does not convey a completed action at a specific time.

Final Answer
The final answer is clearly option C: ''The team submitted the report yesterday.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:58:50.3', '2026-08-26 05:03:37.83', '{"options": ["The team has submitted the report yesterday.", "The team was submitting the report yesterday.", "The team submitted the report yesterday.", "The team submits the report yesterday."], "_generatedQuestionId": "cmt40zxyo002j7gggimltvz9q"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The team has submitted the report yesterday.", "The team was submitting the report yesterday.", "The team submitted the report yesterday.", "The team submits the report yesterday."], "correctAnswer": "The team submitted the report yesterday."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt4122n1003d7gggl1csprhh', 'Select the grammatically correct statement.', 'She doesn''t know how to solve the problem.', 'Concept

This question tests the understanding of subject-verb agreement and the correct form of the verb ''to do'' in negatives.

Formula / Reasoning

The proper construction for negating a verb in English requires the use of ''doesn''t'' with the base form of the verb (know). 

Step-by-Step Solution

1. The option ''She don''t know how to solve the problem.'' is incorrect because ''don''t'' should be ''doesn''t'' when the subject is third person singular.
2. The option ''She doesn''t knows how to solve the problem.'' is incorrect because ''knows'' is the wrong form; it should be ''know''.
3. The option ''She doesn''t know how to solve the problem.'' is correct because it properly uses ''doesn''t'' with the base verb ''know''.
4. The option ''She not know how to solve the problem.'' is incorrect because it omits the auxiliary verb ''does''.

Final Answer
The final answer is clearly option ''She doesn''t know how to solve the problem.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:58:58.909', '2026-08-26 05:03:37.83', '{"options": ["She don''t know how to solve the problem.", "She doesn''t know how to solve the problem.", "She not know how to solve the problem.", "She doesn''t knows how to solve the problem."], "_generatedQuestionId": "cmt40ytjz00257ggg02da373c"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["She don''t know how to solve the problem.", "She doesn''t know how to solve the problem.", "She not know how to solve the problem.", "She doesn''t knows how to solve the problem."], "correctAnswer": "She doesn''t know how to solve the problem."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40ry71001a7ggg9krex4sd', 'Select the grammatically correct version of the following sentence: "The committee have reached their decision after thorough discussions."', 'The committee has reached their decision after thorough discussions.', 'Concept

The concept being tested is grammatical subject-verb agreement in collective nouns.

Formula / Reasoning

In English, collective nouns can take either singular or plural verbs depending on whether the group is acting as a single entity or as individuals. ''Committee'' is typically treated as a singular noun, hence it should be paired with a singular verb ''has''.

Step-by-Step Solution
1. Option A is correct as ''committee'' is treated as a singular noun and uses ''has'', which is grammatically correct.
2. Option B is incorrect because ''have'' does not agree with the singular noun ''committee''.
3. Option C is incorrect as it uses ''its decisions'' which implies multiple decisions, while the original sentence refers to a single decision.
4. Option D is incorrect for the same reason as B; ''have'' does not agree with ''committee''.

Final Answer
The final answer is clearly Option A: "The committee has reached their decision after thorough discussions."', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:06.589', '2026-08-26 05:03:37.83', '{"options": ["The committee has reached its decision after thorough discussion.", "The committee have reached their decisions after thorough discussions.", "The committee has reached their decision after thorough discussions.", "The committee have reached its decision after thorough discussions."], "_generatedQuestionId": "cmt40n912000h7gggemjbf4o1"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["The committee has reached its decision after thorough discussion.", "The committee have reached their decisions after thorough discussions.", "The committee has reached their decision after thorough discussions.", "The committee have reached its decision after thorough discussions."], "correctAnswer": "The committee has reached their decision after thorough discussions."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt40s237001e7gggapd3m622', 'Select the option that represents the correct use of the conditional phrase.', 'Had I known about the meeting, I would have attended it.', 'Concept
This question tests the correct use of conditional phrases in English grammar.

Formula / Reasoning
The correct form requires the past perfect tense (''Had I known'') to indicate a hypothetical situation in the past.

Step-by-Step Solution
1. Option A correctly uses ''Had I known,'' which is the correct past perfect conditional form. 
2. Option B incorrectly uses ''Had I know,'' as ''know'' should be ''known'' in the past perfect.
3. Option C uses ''I would attend,'' which is present tense and does not fit the hypothetical past scenario.
4. Option D incorrectly states ''If I known,'' using the wrong form of ''know'' instead of ''known.''

Final Answer
The final answer is clearly represented by Option A: ''Had I known about the meeting, I would have attended it.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'HARD', null, 'GENERATED', 'cmt3yo8v1000ss8z17rhyarep', 1, 'ACTIVE', 0, null, '2026-08-22 06:51:11.635', '2026-08-26 05:03:37.83', '{"options": ["Had I know about the meeting, I would have attended it.", "Had I known about the meeting, I would have attended it.", "If I known about the meeting, I would have attended it.", "Had I known about the meeting, I would attend it."], "_generatedQuestionId": "cmt40mq67000a7gggoxzyjnl7"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["Had I know about the meeting, I would have attended it.", "Had I known about the meeting, I would have attended it.", "If I known about the meeting, I would have attended it.", "Had I known about the meeting, I would attend it."], "correctAnswer": "Had I known about the meeting, I would have attended it."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x2i56003onhc3fks1vuoh', 'Select the sentence that is grammatically correct.', 'He is interested in learning new languages.', 'Concept
The concept being tested is the correct preposition usage in the context of expressing interest.

Formula / Reasoning
The correct expression is ''interested in'', which indicates a desire or curiosity about a specific subject or activity.

Step-by-Step Solution
1. The phrase ''interested on'' is incorrect; the proper preposition is ''in''.
2. The phrase ''interested for'' is not commonly used in this context and is incorrect.
3. The phrase ''interested to learn'' could be interpreted as correct but does not convey the continuous interest like ''interested in learning''.
4. Therefore, the correct option is ''He is interested in learning new languages.'' as it accurately reflects the standard usage.

Final Answer
The final answer is the correct option: He is interested in learning new languages.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:07:20.539', '2026-08-26 05:03:37.83', '{"options": ["He is interested to learn new languages.", "He is interested for learning new languages.", "He is interested in learning new languages.", "He is interested on learning new languages."], "_generatedQuestionId": "cmt3woku00016nhc3bg0jfdzt"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["He is interested to learn new languages.", "He is interested for learning new languages.", "He is interested in learning new languages.", "He is interested on learning new languages."], "correctAnswer": "He is interested in learning new languages."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3ycgjb0007s8z1xixwip62', 'Which of the following sentences is correctly structured?', 'She enjoys playing tennis after work.', 'Concept
This question tests the grammatical structure of sentences, particularly focusing on verb forms and gerunds.

Formula / Reasoning
The correct form of a verb following certain verbs like ''enjoy'' requires the gerund (verb+ing) form rather than the infinitive (to + verb) or base forms.

Step-by-Step Solution
1. Analyze each option for the correct form of the verb after ''enjoy''.
2. ''She enjoys to play tennis after work.'' - Incorrect because ''enjoy'' is followed by a gerund.
3. ''She enjoys playing tennis after work.'' - Correct; ''playing'' is the gerund form.
4. ''She enjoy playing tennis after work.'' - Incorrect; ''enjoy'' should be ''enjoys'' to agree with the singular subject ''She''.
5. ''She enjoys play tennis after work.'' - Incorrect; ''play'' should be in the gerund form ''playing''.

Final Answer
The final answer is clearly option B: ''She enjoys playing tennis after work.''', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 05:43:04.631', '2026-08-26 05:03:37.83', '{"options": ["She enjoys play tennis after work.", "She enjoys playing tennis after work.", "She enjoy playing tennis after work.", "She enjoys to play tennis after work."], "_generatedQuestionId": "cmt3xmc1d0056nhc3ibms69zj"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["She enjoys play tennis after work.", "She enjoys playing tennis after work.", "She enjoy playing tennis after work.", "She enjoys to play tennis after work."], "correctAnswer": "She enjoys playing tennis after work."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt4120i6003b7ggg8tpd0gy7', 'Which of the following sentences is expressed correctly?', 'He wanted to know if the meeting was on Monday.', 'Concept

The concept being tested is sentence structure and grammatical correctness in indirect questions.

Formula / Reasoning

In indirect questions, the structure does not follow the typical question format; the verb comes before the subject only when posing a direct question. Thus, the sentence must follow statement order in indirect speech.

Step-by-Step Solution

1. The first option is incorrect because it uses a question mark inappropriately, misplacing the use of intonation and punctuation. 
2. The second option is incorrect; it uses present tense ''is'' instead of the past tense ''was'' required in indirect questions. 
3. The correct option maintains proper structure by using past tense ''was'', thereby correctly portraying the indirect nature of the question. 
4. The last option is incorrect as it omits the necessary verb ''was'', making it sound like a direct statement rather than an indirect question.

Final Answer
The final answer is: He wanted to know if the meeting was on Monday.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:58:56.143', '2026-08-26 05:03:37.83', '{"options": ["He wanted to know if the meeting was Monday.", "He wanted to know whether the meeting is on Monday.", "He wanted to know if the meeting was on Monday.", "He wanted to know if the meeting was on Monday?"], "_generatedQuestionId": "cmt40z82e002a7ggg951t50me"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["He wanted to know if the meeting was Monday.", "He wanted to know whether the meeting is on Monday.", "He wanted to know if the meeting was on Monday.", "He wanted to know if the meeting was on Monday?"], "correctAnswer": "He wanted to know if the meeting was on Monday."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt411q2i00337gggbn6c9nh7', 'Which of the following sentences is grammatically accurate?', 'He told me that he would finish the project tomorrow.', 'Concept

The question tests knowledge of indirect speech and verb tenses.

Formula / Reasoning

In indirect speech, the future tense "will" typically changes to "would" in the reported statement.

Step-by-Step Solution

1. Option A uses "will" which does not change correctly in indirect speech. 
2. Option B uses "finishes," which is incorrect as it is not the right tense for reporting a future action. 
3. Option C incorrectly uses "finished" which suggests past action, not future. 
4. Option D correctly changes "will" to "would," aligning with the rules of indirect speech. 

Final Answer

The final answer is clearly option D: He told me that he would finish the project tomorrow.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'MEDIUM', null, 'GENERATED', 'cmt3x93l9004fnhc3wqm6lizu', 1, 'ACTIVE', 0, null, '2026-08-22 06:58:42.618', '2026-08-26 05:03:37.83', '{"options": ["He told me that he finished the project tomorrow.", "He told me that he will finish the project tomorrow.", "He told me that he would finish the project tomorrow.", "He told me that he finishes the project tomorrow."], "_generatedQuestionId": "cmt410dl6002q7ggg6dra7p09"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["He told me that he finished the project tomorrow.", "He told me that he will finish the project tomorrow.", "He told me that he would finish the project tomorrow.", "He told me that he finishes the project tomorrow."], "correctAnswer": "He told me that he would finish the project tomorrow."}', null, 'MANUAL', null, null, 'MCQ', null), ('cmt3x2bly003mnhc3g37o8bcy', 'Which of the following sentences is grammatically correct?', 'He runs faster than anyone.', 'Concept
This question tests the understanding of comparative adverbs in English grammar.

Formula / Reasoning
The correct form for comparisons using ''fast'' is ''faster'' without the use of ''more''.

Step-by-Step Solution
1. Option A uses ''more faster'', which is incorrect because ''faster'' is already a comparative form. 
2. Option B correctly uses ''faster'' as the comparative form of ''fast''. 
3. Option C incorrectly states ''more fast'', which is not a valid comparative structure. 
4. Option D uses ''fastly'', which is not an acceptable adverb form in this context. 

Final Answer
The final answer is clearly Option B: ''He runs faster than anyone.''.', 'f52fc04f-e43d-4259-9c7d-81d2e4a5a91d', null, 'EASY', null, 'GENERATED', 'cmt3w5u010004nhc34a3gplbj', 1, 'ACTIVE', 0, null, '2026-08-22 05:07:12.07', '2026-08-26 05:02:07.041', '{"options": ["He runs more faster than anyone.", "He runs faster than anyone.", "He runs fastly than anyone.", "He runs more fast than anyone."], "_generatedQuestionId": "cmt3wovch0019nhc3k0zy76s6"}', null, null, '916df5c9-84f3-4dd6-97d2-7b96b99f9041', null, null, '{"options": ["He runs more faster than anyone.", "He runs faster than anyone.", "He runs fastly than anyone.", "He runs more fast than anyone."], "correctAnswer": "He runs faster than anyone."}', null, 'MANUAL', null, null, 'MCQ', null);
`;

// Extract all value tuples
// Regex to match ('id', 'question_text', ...)
const valuesRegex = /\((['"]cmt[a-z0-9]+['"][\s\S]*?)(?=\),\s*\(['"]cmt|\);$)/g;

let match;
const records = [];
while ((match = valuesRegex.exec(sqlText)) !== null) {
  records.push(match[1]);
}

console.log("Extracted records:", records.length);

const parsedQuestions = [];

for (const rec of records) {
  // Let's extract:
  // id, question_text, answer, explanation, mcq_data
  const idMatch = rec.match(/^'([^']+)'/);
  const id = idMatch ? idMatch[1] : "unknown";

  // Match JSON objects in rec
  const jsonMatches = rec.match(/\{[\s\S]*?\}(?=',|'\))/g);
  let options = [];
  let mcqAnswer = "";
  if (jsonMatches) {
    for (const jm of jsonMatches) {
      try {
        const parsed = JSON.parse(jm.replace(/''/g, "'"));
        if (parsed.options) {
          options = parsed.options;
          mcqAnswer = parsed.correctAnswer || "";
        }
      } catch (e) {}
    }
  }

  // Extract questionText (2nd field)
  // Let's use custom string tokenizer for SQL literal list
  const tokens = [];
  let inString = false;
  let currentToken = "";
  let i = 0;
  while (i < rec.length) {
    if (rec[i] === "'") {
      if (inString && i + 1 < rec.length && rec[i + 1] === "'") {
        currentToken += "'";
        i += 2;
        continue;
      } else {
        inString = !inString;
        i++;
        continue;
      }
    }
    if (!inString && rec[i] === ",") {
      tokens.push(currentToken.trim());
      currentToken = "";
      i++;
      continue;
    }
    currentToken += rec[i];
    i++;
  }
  if (currentToken) tokens.push(currentToken.trim());

  const qId = tokens[0] || id;
  const questionText = tokens[1] || "";
  const answer = tokens[2] || mcqAnswer;
  const explanation = tokens[3] || "";
  const difficulty = tokens[6] || "";

  parsedQuestions.push({
    id: qId,
    questionText,
    answer,
    explanation,
    difficulty,
    options
  });
}

console.log("Successfully parsed:", parsedQuestions.length);

// Analyze every single question
const auditResults = [];

for (let idx = 0; idx < parsedQuestions.length; idx++) {
  const q = parsedQuestions[idx];
  const issues = [];
  const warnings = [];

  // Check 1: Answer present in options
  const ansIndex = q.options.indexOf(q.answer);
  if (ansIndex === -1) {
    issues.push({
      type: "CRITICAL_MISSING_ANSWER",
      desc: \`Correct answer "\${q.answer}" does not exist in the options list: [\${q.options.map(o => \`"\${o}"\`).join(", ")}]\`
    });
  }

  // Check 2: Exactly 4 options
  if (q.options.length !== 4) {
    issues.push({
      type: "INVALID_OPTION_COUNT",
      desc: \`Options count is \${q.options.length}, expected 4\`
    });
  }

  // Check 3: Duplicate options
  const uniqueOpts = new Set(q.options);
  if (uniqueOpts.size !== q.options.length) {
    issues.push({
      type: "DUPLICATE_OPTIONS",
      desc: \`Contains duplicate options: \${q.options.join(" | ")}\`
    });
  }

  // Check 4: Explanation text mismatch (Hallucinated / Swapped explanations)
  // Check if explanation mentions completely alien words that do not match the question / options
  const explLower = q.explanation.toLowerCase();
  const optsLower = q.options.join(" ").toLowerCase();
  const qLower = q.questionText.toLowerCase();
  const ansLower = q.answer.toLowerCase();

  // Test for specific known hallucinations:
  // e.g., explanation mentions "She is an engineer" while options are about "mystery novels"
  // or explanation mentions "going to the gym" while options are about "The team is working on their project"
  // or explanation mentions "enjoy reading books" while options are about "team is preparing for presentation"
  // or explanation mentions "neither the manager nor the employees were informed" while options are about "If she had known..."
  if (explLower.includes("engineer") && !optsLower.includes("engineer") && !qLower.includes("engineer")) {
    issues.push({
      type: "EXPLANATION_MISMATCH",
      desc: \`Explanation hallucinates about "She is an engineer" / article rules, but the question is actually about "\${q.answer}"\`
    });
  }
  if (explLower.includes("gym") && !optsLower.includes("gym")) {
    issues.push({
      type: "EXPLANATION_MISMATCH",
      desc: \`Explanation hallucinates about "She doesn't like going to the gym", but the question is about "\${q.answer}"\`
    });
  }
  if (explLower.includes("reading books") && !optsLower.includes("reading") && !optsLower.includes("book")) {
    issues.push({
      type: "EXPLANATION_MISMATCH",
      desc: \`Explanation hallucinates about "She enjoys reading books", but the question is about "\${q.answer}"\`
    });
  }
  if (explLower.includes("neither the manager nor the employees were informed") && !optsLower.includes("informed")) {
    issues.push({
      type: "EXPLANATION_MISMATCH",
      desc: \`Explanation hallucinates about "Neither the manager nor the employees were informed", but options are conditional "If she had known..."\`
    });
  }

  // Check 5: Explanation Option Letter Mismatch (e.g. says option B when answer is option C or A)
  const letterMatch = q.explanation.match(/(?:option|answer is:?)\s+([A-D]|1-4)\b/i);
  if (letterMatch && ansIndex !== -1) {
    const stated = letterMatch[1].toUpperCase();
    let statedIdx = -1;
    if (stated === "A" || stated === "1") statedIdx = 0;
    else if (stated === "B" || stated === "2") statedIdx = 1;
    else if (stated === "C" || stated === "3") statedIdx = 2;
    else if (stated === "D" || stated === "4") statedIdx = 3;

    if (statedIdx !== -1 && statedIdx !== ansIndex) {
      warnings.push({
        type: "OPTION_LETTER_MISMATCH",
        desc: \`Explanation refers to option "\${stated}" (index \${statedIdx + 1}), but the answer is located at option "\${String.fromCharCode(65 + ansIndex)}" (index \${ansIndex + 1})\`
      });
    }
  }

  // Check 6: Grammatical Ambiguity / Conflicting Valid Answers
  // e.g. "The team was excited about the project" vs "The team is excited about the project"
  if (q.options.includes("The team was excited about the project.") && q.options.includes("The team is excited about the project.")) {
    issues.push({
      type: "MULTIPLE_VALID_ANSWERS",
      desc: \`Both "The team was excited about the project." (past) and "The team is excited about the project." (present) are grammatically correct standard English.\`
    });
  }

  // e.g. "Last week, the project manager discussed with the team" vs "The manager discussed the project with the team last week."
  if (q.options.includes("Last week, the project manager discussed with the team.") && q.options.includes("The manager discussed the project with the team last week.")) {
    warnings.push({
      type: "DISTRACTOR_AMBIGUITY",
      desc: \`Distractor "Last week, the project manager discussed with the team." is also a grammatically valid sentence.\`
    });
  }

  // e.g. "Every team member submits their reports." vs "Every team member has submitted their report."
  if (q.options.includes("Every team member submits their reports.")) {
    warnings.push({
      type: "DISTRACTOR_AMBIGUITY",
      desc: \`Distractor "Every team member submits their reports." is grammatically valid in simple present tense.\`
    });
  }

  auditResults.push({
    index: idx + 1,
    id: q.id,
    difficulty: q.difficulty,
    questionText: q.questionText,
    answer: q.answer,
    options: q.options,
    explanation: q.explanation,
    issues,
    warnings,
    isCorrect: issues.length === 0 && warnings.length === 0
  });
}

fs.writeFileSync("sql_batch_audit_summary.json", JSON.stringify(auditResults, null, 2), "utf-8");
console.log("Total questions processed:", auditResults.length);
console.log("Flawless questions:", auditResults.filter(r => r.isCorrect).length);
console.log("Questions with critical issues:", auditResults.filter(r => r.issues.length > 0).length);
console.log("Questions with warnings (letter mismatches / subtle ambiguities):", auditResults.filter(r => r.warnings.length > 0).length);
