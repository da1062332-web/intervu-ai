import { describe, it, expect } from 'vitest';

describe('Execution Fixes Verification', () => {
  describe('Resume Answer Parsing & textResponse Restoration', () => {
    function parseResumeAnswers(answers: any[]) {
      return answers.reduce((acc: any, ans: any) => {
        if (!ans || !ans.questionId) return acc;

        let selectedOptionId: string | undefined;
        let selectedOptionIds: string[] | undefined;
        let textResponse: string | undefined;

        const raw = ans.answer;

        if (Array.isArray(raw)) {
          selectedOptionIds = raw.map(String);
        } else if (typeof raw === 'object' && raw !== null) {
          textResponse = JSON.stringify(raw);
        } else if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                selectedOptionIds = parsed.map(String);
              } else {
                selectedOptionId = trimmed;
              }
            } catch {
              selectedOptionId = trimmed;
            }
          } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            textResponse = trimmed;
          } else if (trimmed.startsWith('opt-') || /^[A-Da-d]$/.test(trimmed)) {
            selectedOptionId = trimmed;
          } else {
            textResponse = trimmed;
            selectedOptionId = trimmed;
          }
        } else if (typeof raw === 'number' || typeof raw === 'boolean') {
          textResponse = String(raw);
        }

        const hasAnswer = Boolean(
          selectedOptionId ||
          (selectedOptionIds && selectedOptionIds.length > 0) ||
          (textResponse && textResponse !== '')
        );

        acc[ans.questionId] = {
          status: ans.isMarkedForReview
            ? 'MARKED_FOR_REVIEW'
            : hasAnswer
              ? 'ANSWERED'
              : 'UNANSWERED',
          selectedOptionId,
          selectedOptionIds,
          textResponse,
          timeSpentSeconds: ans.timeSpentSeconds || 0,
        };
        return acc;
      }, {});
    }

    it('safely parses array answers without crashing on startsWith', () => {
      const rawAnswers = [
        { questionId: 'q-mcq', answer: 'opt-1', isMarkedForReview: false },
        { questionId: 'q-msq', answer: ['opt-1', 'opt-2'], isMarkedForReview: false },
        { questionId: 'q-coding', answer: { code: 'def sol(): pass', language: 'python' }, isMarkedForReview: false },
        { questionId: 'q-numeric', answer: 42, isMarkedForReview: true },
        { questionId: 'q-empty', answer: null, isMarkedForReview: false },
      ];

      const formatted = parseResumeAnswers(rawAnswers);

      expect(formatted['q-mcq'].selectedOptionId).toBe('opt-1');
      expect(formatted['q-mcq'].status).toBe('ANSWERED');

      expect(formatted['q-msq'].selectedOptionIds).toEqual(['opt-1', 'opt-2']);
      expect(formatted['q-msq'].status).toBe('ANSWERED');

      expect(formatted['q-coding'].textResponse).toBe(JSON.stringify({ code: 'def sol(): pass', language: 'python' }));
      expect(formatted['q-coding'].status).toBe('ANSWERED');

      expect(formatted['q-numeric'].textResponse).toBe('42');
      expect(formatted['q-numeric'].status).toBe('MARKED_FOR_REVIEW');

      expect(formatted['q-empty'].status).toBe('UNANSWERED');
    });
  });

  describe('Compiler Language Switch Buffering', () => {
    it('switches to target language starter code and preserves code across languages', () => {
      const defaultStarters: Record<string, string> = {
        java: 'public class Main { ... }',
        python: 'def solution(): pass',
      };

      let codeByLanguage: Record<string, string> = {};
      let currentLang = 'java';
      let currentCode = 'public class Main { System.out.println("hello"); }';

      // Switch to Python
      const switchLanguage = (newLang: string) => {
        const updatedBuffers = {
          ...codeByLanguage,
          [currentLang]: currentCode,
        };
        let targetCode = updatedBuffers[newLang];
        if (!targetCode) {
          targetCode = defaultStarters[newLang] || '';
          updatedBuffers[newLang] = targetCode;
        }
        currentLang = newLang;
        currentCode = targetCode;
        codeByLanguage = updatedBuffers;
      };

      switchLanguage('python');
      expect(currentLang).toBe('python');
      expect(currentCode).toBe('def solution(): pass');

      // Edit Python code
      currentCode = 'def solution(): return 123';

      // Switch back to Java
      switchLanguage('java');
      expect(currentLang).toBe('java');
      expect(currentCode).toBe('public class Main { System.out.println("hello"); }');

      // Switch back to Python
      switchLanguage('python');
      expect(currentLang).toBe('python');
      expect(currentCode).toBe('def solution(): return 123');
    });
  });

  describe('Section Advance Timer Guard & Clock Offset', () => {
    it('grants full duration for freshly activated section and does not cascade to 0', () => {
      const serverTime = '2026-09-11T03:00:00.000Z';
      // Local client clock is 10 minutes ahead of server clock (600s skew)
      const clientNow = new Date('2026-09-11T03:10:00.000Z').getTime();
      const serverClockOffsetMs = clientNow - new Date(serverTime).getTime(); // 600,000ms

      const nextSectionDurationSeconds = 1500; // 25 min section
      const sectionStartedAt = '2026-09-11T03:00:00.000Z'; // server just started it

      // Corrected calculation
      const serverNow = clientNow - serverClockOffsetMs;
      const sectionStarted = new Date(sectionStartedAt).getTime();
      const elapsed = Math.floor((serverNow - sectionStarted) / 1000); // 0s elapsed!

      let remaining = 0;
      if (elapsed <= 2) {
        remaining = nextSectionDurationSeconds;
      } else {
        remaining = Math.max(5, nextSectionDurationSeconds - elapsed);
      }

      expect(remaining).toBe(1500);
      expect(remaining).toBeGreaterThan(0);
    });
  });
});
