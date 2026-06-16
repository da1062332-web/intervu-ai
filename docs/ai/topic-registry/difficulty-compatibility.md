# Difficulty Compatibility Matrix

**Module:** Module 1.2.1 Topic Registry  
**Purpose:** Restricting Cognitive Target Levels for Question Generation  
**Version:** 1.0.0

---

## 1. Objective

The **Difficulty Compatibility Matrix** defines which cognitive difficulty levels (Easy, Medium, Hard) are supported by each technical concept. By restricting these mappings, the generation engine prevents the AI model from attempting to formulate questions that do not align with the concept's natural complexity.

---

## 2. Core Matrix (Software Engineering Examples)

| Concept                   | Easy | Medium | Hard | Reason / Scenario                                                                                                                                                                |
| :------------------------ | :--: | :----: | :--: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Array Traversal**       |  ✅  |   ✅   |  ❌  | Traversal is a basic skill. Attempting to generate a "Hard" question on traversal yields artificial complexity (e.g., nesting unnecessary loops) instead of testable algorithms. |
| **Sliding Window**        |  ❌  |   ✅   |  ✅  | Sliding Window requires advanced index management. Attempting to generate an "Easy" version makes it a simple array iteration question, breaking the definition of the concept.  |
| **SOLID Principles**      |  ✅  |   ✅   |  ✅  | Easily scalable: from naming the acronym (Easy), to identifying design patterns (Medium), to resolving complex architecture smell refactorings (Hard).                           |
| **Distributed Consensus** |  ❌  |   ❌   |  ✅  | Consensus (e.g., Paxos, Raft) is fundamentally a hard topic. Easy/Medium questions either become simple trivia questions or fail to test the real engineering complexity.        |

---

## 3. How the Generator Uses the Matrix

During the configuration-to-prompt pipeline (Module 2), the system enforces these mappings to perform pre-filtering:

1. **Config Selection:** An administrator configures an exam targeting a role with a specific difficulty mix (e.g., a junior developer role requesting "Easy" questions).
2. **Concept Filtering:** The system queries the `TopicRegistry` to fetch concepts. It filters out any concept where `difficultySupport.easy === false` (such as Distributed Consensus).
3. **Safe Prompt Generation:** Only the remaining compatible concepts (e.g., Array Traversal, SOLID Principles) are passed to the AI prompt generator. This guarantees that the LLM is prompted only with concepts it can cleanly represent at that difficulty tier.
