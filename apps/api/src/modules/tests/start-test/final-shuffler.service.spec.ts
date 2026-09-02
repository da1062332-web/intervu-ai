import {
  FinalShufflerService,
  ShufflerSectionData,
} from "./final-shuffler.service";

describe("FinalShufflerService", () => {
  let service: FinalShufflerService;

  beforeEach(() => {
    service = new FinalShufflerService();
    // Deterministic random for predictable shuffling
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const getMockSections = (): ShufflerSectionData[] => [
    {
      sectionKey: "S1",
      sectionName: "Section 1",
      durationSeconds: 300,
      questionCount: 3,
      orderIndex: 0,
      questions: [
        {
          questionId: "q1",
          questionOrder: 0,
          questionSnapshot: {
            questionType: "MCQ",
            options: ["A", "B", "C"],
            correctAnswer: "B",
          },
        },
        {
          questionId: "q2",
          questionOrder: 1,
          questionSnapshot: {
            questionType: "MCQ",
            options: ["X", "Y", "Z"],
            correctAnswer: "Z",
          },
        },
        {
          questionId: "q3",
          questionOrder: 2,
          questionSnapshot: {
            questionType: "CODING",
            options: null, // No options
            correctAnswer: "def foo(): pass",
          },
        },
      ],
    },
  ];

  it("should not shuffle when both flags are false", () => {
    const input = getMockSections();
    const result = service.shuffleSections(input, {
      shuffleQuestionsEnabled: false,
      shuffleOptionsEnabled: false,
    });

    expect(result[0].questions[0].questionId).toBe("q1");
    expect(result[0].questions[1].questionId).toBe("q2");
    expect(result[0].questions[2].questionId).toBe("q3");

    expect(result[0].questions[0].questionSnapshot.options).toEqual([
      "A",
      "B",
      "C",
    ]);
    // Must return a clone to prevent mutation downstream
    expect(result).not.toBe(input);
  });

  it("should shuffle questions but not options when shuffleQuestionsEnabled is true", () => {
    const input = getMockSections();
    const result = service.shuffleSections(input, {
      shuffleQuestionsEnabled: true,
      shuffleOptionsEnabled: false,
    });

    // Math.random() = 0 means elements are reversed due to swap
    // original: q1, q2, q3
    // i=2, j=0 => swap(2,0) => q3, q2, q1
    // i=1, j=0 => swap(1,0) => q2, q3, q1
    expect(result[0].questions[0].questionId).toBe("q2");
    expect(result[0].questions[1].questionId).toBe("q3");
    expect(result[0].questions[2].questionId).toBe("q1");

    // questionOrder must be reassigned
    expect(result[0].questions[0].questionOrder).toBe(0);
    expect(result[0].questions[1].questionOrder).toBe(1);
    expect(result[0].questions[2].questionOrder).toBe(2);

    // options must be unchanged
    expect(result[0].questions[2].questionSnapshot.options).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  it("should shuffle options but not questions when shuffleOptionsEnabled is true", () => {
    const input = getMockSections();
    const result = service.shuffleSections(input, {
      shuffleQuestionsEnabled: false,
      shuffleOptionsEnabled: true,
    });

    // Question order preserved
    expect(result[0].questions[0].questionId).toBe("q1");

    // MCQ Options shuffled
    // original: A, B, C -> B, C, A
    expect(result[0].questions[0].questionSnapshot.options).toEqual([
      "B",
      "C",
      "A",
    ]);
    expect(result[0].questions[0].questionSnapshot.correctAnswer).toBe("B"); // Correct answer value preserved

    // Non-MCQ ignored
    expect(result[0].questions[2].questionSnapshot.options).toBeNull();
  });

  it("should shuffle both when both flags are true", () => {
    const input = getMockSections();
    const result = service.shuffleSections(input, {
      shuffleQuestionsEnabled: true,
      shuffleOptionsEnabled: true,
    });

    // Questions reversed to B, C, A (q2, q3, q1)
    expect(result[0].questions[0].questionId).toBe("q2");
    expect(result[0].questions[2].questionId).toBe("q1");

    // Options shuffled for q1 (now at index 2) -> A, B, C -> B, C, A
    expect(result[0].questions[2].questionSnapshot.options).toEqual([
      "B",
      "C",
      "A",
    ]);
    expect(result[0].questions[2].questionSnapshot.correctAnswer).toBe("B");
  });

  it("should not mutate the input objects", () => {
    const input = getMockSections();
    const originalQ1Options = [
      ...input[0].questions[0].questionSnapshot.options,
    ];

    service.shuffleSections(input, {
      shuffleQuestionsEnabled: true,
      shuffleOptionsEnabled: true,
    });

    // The input object should remain completely unchanged
    expect(input[0].questions[0].questionId).toBe("q1");
    expect(input[0].questions[0].questionSnapshot.options).toEqual(
      originalQ1Options,
    );
  });

  it("should re-map index-form answers to exact option text before shuffling options", () => {
    const sections: ShufflerSectionData[] = [
      {
        sectionKey: "S1",
        sectionName: "Section 1",
        durationSeconds: 300,
        questionCount: 1,
        orderIndex: 0,
        questions: [
          {
            questionId: "q_index",
            questionOrder: 0,
            questionSnapshot: {
              questionType: "MCQ",
              options: ["Paris", "London", "Berlin", "Madrid"],
              correctAnswer: "0", // Index-form answer representing "Paris"
            },
          },
        ],
      },
    ];

    const result = service.shuffleSections(sections, {
      shuffleQuestionsEnabled: false,
      shuffleOptionsEnabled: true,
    });

    // Options are shuffled: Paris, London, Berlin, Madrid -> London, Berlin, Paris, Madrid (or similar deterministic shuffle)
    // The correctAnswer must now be the actual target string "Paris"
    expect(result[0].questions[0].questionSnapshot.correctAnswer).toBe("Paris");
    expect(result[0].questions[0].questionSnapshot.answer).toBe("Paris");
    expect(result[0].questions[0].questionSnapshot.options).toContain("Paris");
  });

  it("should re-map letter-form answers like 'Option B' to option text before shuffling", () => {
    const sections: ShufflerSectionData[] = [
      {
        sectionKey: "S1",
        sectionName: "Section 1",
        durationSeconds: 300,
        questionCount: 1,
        orderIndex: 0,
        questions: [
          {
            questionId: "q_letter",
            questionOrder: 0,
            questionSnapshot: {
              questionType: "MCQ",
              options: ["Paris", "London", "Berlin", "Madrid"],
              correctAnswer: "Option B", // Letter-form answer representing "London" (index 1)
            },
          },
        ],
      },
    ];

    const result = service.shuffleSections(sections, {
      shuffleQuestionsEnabled: false,
      shuffleOptionsEnabled: true,
    });

    expect(result[0].questions[0].questionSnapshot.correctAnswer).toBe("London");
    expect(result[0].questions[0].questionSnapshot.options).toContain("London");
  });
});
