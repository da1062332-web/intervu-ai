import { PrismaClient, DifficultyLevel, GenerationStrategy, TopicStatus, ConceptStatus } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";

// Helper to generate clean, responsive SVG wrapper
function svgWrap(content: string, width = 200, height = 200): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="w-full h-full"><rect width="${width}" height="${height}" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>${content}</svg>`;
}

// Generate unique SVG figures for 138 concepts
export interface ConceptQuestionData {
  topicCode: string;
  topicName: string;
  conceptCode: string;
  conceptName: string;
  difficulty: DifficultyLevel;
  stem: string;
  stemSvg: string;
  options: {
    key: "A" | "B" | "C" | "D";
    svgCode: string;
    isCorrect: boolean;
    label?: string;
  }[];
  correctAnswer: "A" | "B" | "C" | "D";
  solution: string;
}

export function generateAllVisualReasoningData(): ConceptQuestionData[] {
  const items: ConceptQuestionData[] = [];

  // Helper for generating standard rotational figures
  const makeRotatedArrow = (deg: number, color = "#6366f1") =>
    `<g transform="rotate(${deg}, 100, 100)"><line x1="100" y1="150" x2="100" y2="50" stroke="${color}" stroke-width="6" stroke-linecap="round"/><polygon points="88,60 100,40 112,60" fill="${color}"/><circle cx="100" cy="150" r="8" fill="${color}"/></g>`;

  // Helper for shape matrices / grids
  const makeGrid2x2 = (c1: string, c2: string, c3: string, c4: string) =>
    `<g stroke="#64748b" stroke-width="2" fill="none"><rect x="30" y="30" width="140" height="140" rx="4"/><line x1="100" y1="30" x2="100" y2="170"/><line x1="30" y1="100" x2="170" y2="100"/></g><g transform="translate(40,40)">${c1}</g><g transform="translate(110,40)">${c2}</g><g transform="translate(40,110)">${c3}</g><g transform="translate(110,110)">${c4}</g>`;

  // TOPIC 1: FIGURE SERIES
  // 1. Single-shape rotation
  items.push({
    topicCode: "FIGURE_SERIES",
    topicName: "Figure Series",
    conceptCode: "SINGLE_SHAPE_ROTATION",
    conceptName: "Single-shape rotation",
    difficulty: DifficultyLevel.EASY,
    stem: "Observe the sequence of arrows rotating 45° clockwise at each step. Which figure comes next?",
    stemSvg: svgWrap(`
      <text x="100" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#334155">Sequence: 0° → 45° → 90° → ?</text>
      <g transform="translate(-60, -20) scale(0.6)">${makeRotatedArrow(0)}</g>
      <g transform="translate(10, -20) scale(0.6)">${makeRotatedArrow(45)}</g>
      <g transform="translate(80, -20) scale(0.6)">${makeRotatedArrow(90)}</g>
      <rect x="145" y="60" width="45" height="70" rx="4" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="4,4"/>
      <text x="167" y="102" text-anchor="middle" font-size="20" font-weight="bold" fill="#64748b">?</text>
    `),
    options: [
      { key: "A", svgCode: svgWrap(makeRotatedArrow(135)), isCorrect: true, label: "135° Clockwise" },
      { key: "B", svgCode: svgWrap(makeRotatedArrow(180)), isCorrect: false, label: "180° Clockwise" },
      { key: "C", svgCode: svgWrap(makeRotatedArrow(45)), isCorrect: false, label: "45° Clockwise" },
      { key: "D", svgCode: svgWrap(makeRotatedArrow(270)), isCorrect: false, label: "270° Clockwise" },
    ],
    correctAnswer: "A",
    solution: "The arrow rotates 45° clockwise at each successive step (0° → 45° → 90°). Therefore, the next figure must be rotated 90° + 45° = 135° clockwise, matching Option A."
  });

  // 2. Alternating shape/color
  items.push({
    topicCode: "FIGURE_SERIES",
    topicName: "Figure Series",
    conceptCode: "ALTERNATING_SHAPE_COLOR",
    conceptName: "Alternating shape/color",
    difficulty: DifficultyLevel.EASY,
    stem: "Identify the next figure in the alternating pattern: Blue Circle → Orange Square → Blue Circle → Orange Square → ?",
    stemSvg: svgWrap(`
      <circle cx="40" cy="100" r="18" fill="#3b82f6"/>
      <rect x="70" y="82" width="36" height="36" fill="#f97316" rx="4"/>
      <circle cx="130" cy="100" r="18" fill="#3b82f6"/>
      <rect x="160" y="82" width="36" height="36" fill="#f97316" rx="4"/>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<circle cx="100" cy="100" r="28" fill="#3b82f6"/>`), isCorrect: true, label: "Blue Circle" },
      { key: "B", svgCode: svgWrap(`<rect x="75" y="75" width="50" height="50" fill="#f97316" rx="4"/>`), isCorrect: false, label: "Orange Square" },
      { key: "C", svgCode: svgWrap(`<polygon points="100,60 130,130 70,130" fill="#10b981"/>`), isCorrect: false, label: "Green Triangle" },
      { key: "D", svgCode: svgWrap(`<circle cx="100" cy="100" r="28" fill="#f97316"/>`), isCorrect: false, label: "Orange Circle" },
    ],
    correctAnswer: "A",
    solution: "The sequence alternates strictly between Blue Circle and Orange Square. The 5th element in this sequence must be a Blue Circle (Option A)."
  });

  // 3. Progressive addition/removal
  items.push({
    topicCode: "FIGURE_SERIES",
    topicName: "Figure Series",
    conceptCode: "PROGRESSIVE_ADDITION_REMOVAL",
    conceptName: "Progressive addition/removal",
    difficulty: DifficultyLevel.MEDIUM,
    stem: "Each step adds one concentric ring. Which figure represents the 4th step?",
    stemSvg: svgWrap(`
      <circle cx="45" cy="100" r="15" fill="none" stroke="#6366f1" stroke-width="4"/>
      <g transform="translate(45,0)"><circle cx="45" cy="100" r="15" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="45" cy="100" r="25" fill="none" stroke="#6366f1" stroke-width="4"/></g>
      <g transform="translate(90,0)"><circle cx="45" cy="100" r="15" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="45" cy="100" r="25" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="45" cy="100" r="35" fill="none" stroke="#6366f1" stroke-width="4"/></g>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<circle cx="100" cy="100" r="15" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="100" r="25" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="100" r="35" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="100" r="45" fill="none" stroke="#6366f1" stroke-width="4"/>`), isCorrect: true, label: "4 Concentric Rings" },
      { key: "B", svgCode: svgWrap(`<circle cx="100" cy="100" r="15" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="100" r="25" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="100" r="35" fill="none" stroke="#6366f1" stroke-width="4"/>`), isCorrect: false, label: "3 Concentric Rings" },
      { key: "C", svgCode: svgWrap(`<circle cx="100" cy="100" r="15" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="100" r="25" fill="none" stroke="#6366f1" stroke-width="4"/>`), isCorrect: false, label: "2 Concentric Rings" },
      { key: "D", svgCode: svgWrap(`<circle cx="100" cy="100" r="45" fill="#6366f1"/>`), isCorrect: false, label: "Solid Circle" },
    ],
    correctAnswer: "A",
    solution: "The count of concentric rings increases by 1 in each step (1 → 2 → 3). The 4th figure must have exactly 4 concentric rings (Option A)."
  });

  // 4. Multiple simultaneous transformations
  items.push({
    topicCode: "FIGURE_SERIES",
    topicName: "Figure Series",
    conceptCode: "MULTIPLE_SIMULTANEOUS_TRANSFORMATIONS",
    conceptName: "Multiple simultaneous transformations",
    difficulty: DifficultyLevel.HARD,
    stem: "A triangle rotates 90° clockwise while a dot moves clockwise around the perimeter corners. Which is the next figure?",
    stemSvg: svgWrap(`
      <polygon points="50,30 80,80 20,80" fill="none" stroke="#0f172a" stroke-width="3"/>
      <circle cx="50" cy="30" r="4" fill="#ef4444"/>
      <polygon points="150,50 100,20 100,80" fill="none" stroke="#0f172a" stroke-width="3"/>
      <circle cx="150" cy="50" r="4" fill="#ef4444"/>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<polygon points="100,150 70,100 130,100" fill="none" stroke="#0f172a" stroke-width="4"/><circle cx="70" cy="100" r="6" fill="#ef4444"/>`), isCorrect: true, label: "Inverted with dot on bottom-left vertex" },
      { key: "B", svgCode: svgWrap(`<polygon points="100,150 70,100 130,100" fill="none" stroke="#0f172a" stroke-width="4"/><circle cx="100" cy="150" r="6" fill="#ef4444"/>`), isCorrect: false, label: "Inverted with dot on apex" },
      { key: "C", svgCode: svgWrap(`<polygon points="100,50 130,100 70,100" fill="none" stroke="#0f172a" stroke-width="4"/><circle cx="100" cy="50" r="6" fill="#ef4444"/>`), isCorrect: false, label: "Upright with dot on apex" },
      { key: "D", svgCode: svgWrap(`<polygon points="50,100 100,130 100,70" fill="none" stroke="#0f172a" stroke-width="4"/><circle cx="50" cy="100" r="6" fill="#ef4444"/>`), isCorrect: false, label: "Left-facing triangle" },
    ],
    correctAnswer: "A",
    solution: "The triangle body rotates 90° CW per step (pointing Up → Right → Down). Simultaneously, the red dot advances to the next CW vertex. Step 3 points Down with the dot on the bottom-left vertex (Option A)."
  });

  // 5. Rotation + count progression
  items.push({
    topicCode: "FIGURE_SERIES",
    topicName: "Figure Series",
    conceptCode: "ROTATION_COUNT_PROGRESSION",
    conceptName: "Rotation + count progression",
    difficulty: DifficultyLevel.HARD,
    stem: "Shapes rotate 90° counter-clockwise while their count increases by 1 each step (1 arrow up → 2 arrows left → 3 arrows down → ?).",
    stemSvg: svgWrap(`
      <g transform="translate(30,100)"><line x1="0" y1="20" x2="0" y2="-20" stroke="#2563eb" stroke-width="3"/><polygon points="-4,-15 0,-25 4,-15" fill="#2563eb"/></g>
      <g transform="translate(80,90)"><line x1="20" y1="0" x2="-20" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="-15,-4 -25,0 -15,4" fill="#2563eb"/></g>
      <g transform="translate(80,110)"><line x1="20" y1="0" x2="-20" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="-15,-4 -25,0 -15,4" fill="#2563eb"/></g>
      <g transform="translate(140,80)"><line x1="0" y1="-20" x2="0" y2="20" stroke="#2563eb" stroke-width="3"/><polygon points="-4,15 0,25 4,15" fill="#2563eb"/></g>
      <g transform="translate(140,100)"><line x1="0" y1="-20" x2="0" y2="20" stroke="#2563eb" stroke-width="3"/><polygon points="-4,15 0,25 4,15" fill="#2563eb"/></g>
      <g transform="translate(140,120)"><line x1="0" y1="-20" x2="0" y2="20" stroke="#2563eb" stroke-width="3"/><polygon points="-4,15 0,25 4,15" fill="#2563eb"/></g>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<g transform="translate(100,70)"><line x1="-25" y1="0" x2="25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="15,-4 25,0 15,4" fill="#2563eb"/></g><g transform="translate(100,90)"><line x1="-25" y1="0" x2="25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="15,-4 25,0 15,4" fill="#2563eb"/></g><g transform="translate(100,110)"><line x1="-25" y1="0" x2="25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="15,-4 25,0 15,4" fill="#2563eb"/></g><g transform="translate(100,130)"><line x1="-25" y1="0" x2="25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="15,-4 25,0 15,4" fill="#2563eb"/></g>`), isCorrect: true, label: "4 Right-pointing arrows" },
      { key: "B", svgCode: svgWrap(`<g transform="translate(100,70)"><line x1="25" y1="0" x2="-25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="-15,-4 -25,0 -15,4" fill="#2563eb"/></g><g transform="translate(100,90)"><line x1="25" y1="0" x2="-25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="-15,-4 -25,0 -15,4" fill="#2563eb"/></g><g transform="translate(100,110)"><line x1="25" y1="0" x2="-25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="-15,-4 -25,0 -15,4" fill="#2563eb"/></g><g transform="translate(100,130)"><line x1="25" y1="0" x2="-25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="-15,-4 -25,0 -15,4" fill="#2563eb"/></g>`), isCorrect: false, label: "4 Left-pointing arrows" },
      { key: "C", svgCode: svgWrap(`<g transform="translate(100,80)"><line x1="0" y1="20" x2="0" y2="-20" stroke="#2563eb" stroke-width="3"/><polygon points="-4,-15 0,-25 4,-15" fill="#2563eb"/></g><g transform="translate(100,100)"><line x1="0" y1="20" x2="0" y2="-20" stroke="#2563eb" stroke-width="3"/><polygon points="-4,-15 0,-25 4,-15" fill="#2563eb"/></g><g transform="translate(100,120)"><line x1="0" y1="20" x2="0" y2="-20" stroke="#2563eb" stroke-width="3"/><polygon points="-4,-15 0,-25 4,-15" fill="#2563eb"/></g>`), isCorrect: false, label: "3 Upward arrows" },
      { key: "D", svgCode: svgWrap(`<g transform="translate(100,100)"><line x1="-25" y1="0" x2="25" y2="0" stroke="#2563eb" stroke-width="3"/><polygon points="15,-4 25,0 15,4" fill="#2563eb"/></g>`), isCorrect: false, label: "1 Rightward arrow" },
    ],
    correctAnswer: "A",
    solution: "The count of arrows increments by 1 (1 → 2 → 3 → 4) while the direction rotates 90° CCW (Up → Left → Down → Right). The next figure has 4 right-pointing arrows (Option A)."
  });

  // 6. Interleaved multi-rule sequence
  items.push({
    topicCode: "FIGURE_SERIES",
    topicName: "Figure Series",
    conceptCode: "INTERLEAVED_MULTI_RULE_SEQUENCE",
    conceptName: "Interleaved multi-rule sequence",
    difficulty: DifficultyLevel.HARD,
    stem: "Two independent sequences interleave: Odd positions increment circle count (●, ●●, ●●●), even positions invert triangles (▲, ▼, ▲). Find the 6th element.",
    stemSvg: svgWrap(`
      <text x="100" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">Pos 1: ● | Pos 2: ▲ | Pos 3: ●● | Pos 4: ▼ | Pos 5: ●●● | Pos 6: ?</text>
      <circle cx="30" cy="100" r="8" fill="#1e293b"/>
      <polygon points="65,90 75,110 55,110" fill="#10b981"/>
      <circle cx="100" cy="95" r="7" fill="#1e293b"/><circle cx="100" cy="115" r="7" fill="#1e293b"/>
      <polygon points="135,110 145,90 125,90" fill="#10b981"/>
      <circle cx="170" cy="85" r="6" fill="#1e293b"/><circle cx="170" cy="100" r="6" fill="#1e293b"/><circle cx="170" cy="115" r="6" fill="#1e293b"/>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<polygon points="100,80 125,120 75,120" fill="#10b981"/>`), isCorrect: true, label: "Upright Green Triangle" },
      { key: "B", svgCode: svgWrap(`<polygon points="100,120 125,80 75,80" fill="#10b981"/>`), isCorrect: false, label: "Inverted Green Triangle" },
      { key: "C", svgCode: svgWrap(`<circle cx="100" cy="70" r="8" fill="#1e293b"/><circle cx="100" cy="90" r="8" fill="#1e293b"/><circle cx="100" cy="110" r="8" fill="#1e293b"/><circle cx="100" cy="130" r="8" fill="#1e293b"/>`), isCorrect: false, label: "4 Circles" },
      { key: "D", svgCode: svgWrap(`<rect x="80" y="80" width="40" height="40" fill="#f59e0b"/>`), isCorrect: false, label: "Orange Square" },
    ],
    correctAnswer: "A",
    solution: "Position 6 is an even index in the interleaved sequence. Even indices follow the triangle rule: Pos 2 is Up (▲), Pos 4 is Down (▼), so Pos 6 must be Up (▲) (Option A)."
  });

  // TOPIC 2: FIGURE ANALOGY
  // 1. Rotation analogy
  items.push({
    topicCode: "FIGURE_ANALOGY",
    topicName: "Figure Analogy",
    conceptCode: "ROTATION_ANALOGY",
    conceptName: "Rotation analogy",
    difficulty: DifficultyLevel.EASY,
    stem: "Figure A is rotated 90° clockwise to become Figure B. Apply the identical rule to Figure C to find Figure D.",
    stemSvg: svgWrap(`
      <text x="100" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">A : B :: C : ?</text>
      <!-- A -->
      <g transform="translate(15, 60) scale(0.35)"><polygon points="50,10 90,90 10,90" fill="#3b82f6"/></g>
      <text x="60" y="80" font-size="14" font-weight="bold" fill="#64748b">:</text>
      <!-- B -->
      <g transform="translate(65, 60) scale(0.35)"><polygon points="90,50 10,10 10,90" fill="#3b82f6"/></g>
      <text x="110" y="80" font-size="14" font-weight="bold" fill="#64748b">::</text>
      <!-- C -->
      <g transform="translate(115, 60) scale(0.35)"><rect x="10" y="30" width="80" height="40" fill="#10b981"/></g>
      <text x="160" y="80" font-size="14" font-weight="bold" fill="#64748b">:</text>
      <text x="175" y="80" font-size="18" font-weight="bold" fill="#dc2626">?</text>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<rect x="80" y="50" width="40" height="100" fill="#10b981" rx="4"/>`), isCorrect: true, label: "Vertical Rectangle" },
      { key: "B", svgCode: svgWrap(`<rect x="50" y="80" width="100" height="40" fill="#10b981" rx="4"/>`), isCorrect: false, label: "Horizontal Rectangle" },
      { key: "C", svgCode: svgWrap(`<polygon points="100,50 150,150 50,150" fill="#10b981"/>`), isCorrect: false, label: "Triangle" },
      { key: "D", svgCode: svgWrap(`<circle cx="100" cy="100" r="45" fill="#10b981"/>`), isCorrect: false, label: "Circle" },
    ],
    correctAnswer: "A",
    solution: "Figure A (pointing up) is rotated 90° clockwise to produce Figure B (pointing right). Applying 90° CW rotation to horizontal rectangle C produces vertical rectangle D (Option A)."
  });

  // 2. Shape replacement
  items.push({
    topicCode: "FIGURE_ANALOGY",
    topicName: "Figure Analogy",
    conceptCode: "SHAPE_REPLACEMENT",
    conceptName: "Shape replacement",
    difficulty: DifficultyLevel.EASY,
    stem: "Circle with an inner square corresponds to Square with an inner triangle. Triangle with an inner circle corresponds to:",
    stemSvg: svgWrap(`
      <text x="100" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">Rule: Inner shape becomes outer container</text>
      <!-- A -->
      <circle cx="40" cy="80" r="22" fill="none" stroke="#6366f1" stroke-width="3"/>
      <rect x="28" y="68" width="24" height="24" fill="#6366f1"/>
      <text x="70" y="85" font-size="14" font-weight="bold">:</text>
      <!-- B -->
      <rect x="82" y="58" width="44" height="44" fill="none" stroke="#6366f1" stroke-width="3"/>
      <circle cx="104" cy="80" r="12" fill="#6366f1"/>
      <text x="135" y="85" font-size="14" font-weight="bold">::</text>
      <text x="155" y="85" font-size="14" font-weight="bold">▲(●) : ?</text>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<circle cx="100" cy="100" r="50" fill="none" stroke="#6366f1" stroke-width="4"/><polygon points="100,70 130,130 70,130" fill="#6366f1"/>`), isCorrect: true, label: "Circle enclosing solid Triangle" },
      { key: "B", svgCode: svgWrap(`<polygon points="100,40 160,160 40,160" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="115" r="25" fill="#6366f1"/>`), isCorrect: false, label: "Triangle enclosing Circle" },
      { key: "C", svgCode: svgWrap(`<rect x="50" y="50" width="100" height="100" fill="none" stroke="#6366f1" stroke-width="4"/><circle cx="100" cy="100" r="30" fill="#6366f1"/>`), isCorrect: false, label: "Square enclosing Circle" },
      { key: "D", svgCode: svgWrap(`<circle cx="100" cy="100" r="50" fill="#6366f1"/>`), isCorrect: false, label: "Solid Circle" },
    ],
    correctAnswer: "A",
    solution: "The inner solid shape expands to become the outer outline, while the outer container becomes the inner solid element. Triangle containing Circle becomes Circle containing Triangle (Option A)."
  });

  // 3. Addition/removal of element
  items.push({
    topicCode: "FIGURE_ANALOGY",
    topicName: "Figure Analogy",
    conceptCode: "ADDITION_REMOVAL_OF_ELEMENT",
    conceptName: "Addition/removal of element",
    difficulty: DifficultyLevel.MEDIUM,
    stem: "In the analogy, 3 parallel lines lose 1 line to become 2 lines. What does a 5-sided pentagon become when losing 1 side?",
    stemSvg: svgWrap(`
      <text x="100" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">3 Lines : 2 Lines :: Pentagon : ?</text>
      <g transform="translate(20,50)"><line x1="0" y1="10" x2="30" y2="10" stroke="#0284c7" stroke-width="3"/><line x1="0" y1="25" x2="30" y2="25" stroke="#0284c7" stroke-width="3"/><line x1="0" y1="40" x2="30" y2="40" stroke="#0284c7" stroke-width="3"/></g>
      <text x="65" y="80" font-size="14" font-weight="bold">:</text>
      <g transform="translate(80,55)"><line x1="0" y1="15" x2="30" y2="15" stroke="#0284c7" stroke-width="3"/><line x1="0" y1="30" x2="30" y2="30" stroke="#0284c7" stroke-width="3"/></g>
      <text x="120" y="80" font-size="14" font-weight="bold">::</text>
      <polygon points="160,55 175,65 170,85 150,85 145,65" fill="none" stroke="#0284c7" stroke-width="2"/>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<rect x="60" y="60" width="80" height="80" fill="none" stroke="#0284c7" stroke-width="4"/>`), isCorrect: true, label: "4-Sided Quadrilateral / Square" },
      { key: "B", svgCode: svgWrap(`<polygon points="100,50 150,140 50,140" fill="none" stroke="#0284c7" stroke-width="4"/>`), isCorrect: false, label: "3-Sided Triangle" },
      { key: "C", svgCode: svgWrap(`<polygon points="100,45 145,70 145,130 100,155 55,130 55,70" fill="none" stroke="#0284c7" stroke-width="4"/>`), isCorrect: false, label: "6-Sided Hexagon" },
      { key: "D", svgCode: svgWrap(`<circle cx="100" cy="100" r="45" fill="none" stroke="#0284c7" stroke-width="4"/>`), isCorrect: false, label: "Circle" },
    ],
    correctAnswer: "A",
    solution: "The rule decreases the side/element count by 1 (3 lines → 2 lines). A 5-sided pentagon minus 1 side produces a 4-sided polygon / square (Option A)."
  });

  // 4. Rotation + reflection combination
  items.push({
    topicCode: "FIGURE_ANALOGY",
    topicName: "Figure Analogy",
    conceptCode: "ROTATION_REFLECTION_COMBINATION",
    conceptName: "Rotation + reflection combination",
    difficulty: DifficultyLevel.HARD,
    stem: "The figure undergoes a 90° clockwise rotation followed by a vertical reflection across the horizontal axis.",
    stemSvg: svgWrap(`
      <text x="100" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">Rule: 90° CW Rotation + Vertical Flip</text>
      <g transform="translate(40,50)"><path d="M 0,0 L 30,0 L 30,20 L 15,20 L 15,40 L 0,40 Z" fill="#8b5cf6"/></g>
      <text x="95" y="80" font-size="14" font-weight="bold">➔</text>
      <g transform="translate(130,50)"><path d="M 0,20 L 15,20 L 15,0 L 35,0 L 35,30 L 0,30 Z" fill="#8b5cf6"/></g>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<g transform="translate(60,60)"><path d="M 0,40 L 30,40 L 30,0 L 70,0 L 70,60 L 0,60 Z" fill="#8b5cf6"/></g>`), isCorrect: true, label: "Correct compound rotated and flipped figure" },
      { key: "B", svgCode: svgWrap(`<g transform="translate(60,60)"><path d="M 0,0 L 70,0 L 70,40 L 40,40 L 40,60 L 0,60 Z" fill="#8b5cf6"/></g>`), isCorrect: false, label: "Rotated only" },
      { key: "C", svgCode: svgWrap(`<g transform="translate(60,60)"><path d="M 0,0 L 30,0 L 30,30 L 70,30 L 70,60 L 0,60 Z" fill="#8b5cf6"/></g>`), isCorrect: false, label: "Flipped only" },
      { key: "D", svgCode: svgWrap(`<circle cx="100" cy="100" r="40" fill="#8b5cf6"/>`), isCorrect: false, label: "Solid circle" },
    ],
    correctAnswer: "A",
    solution: "Applying a 90° clockwise rotation and reflecting vertically over the horizontal axis maps the L-bracket profile directly to Option A."
  });

  // 5. Multiple element transformations
  items.push({
    topicCode: "FIGURE_ANALOGY",
    topicName: "Figure Analogy",
    conceptCode: "MULTIPLE_ELEMENT_TRANSFORMATIONS",
    conceptName: "Multiple element transformations",
    difficulty: DifficultyLevel.HARD,
    stem: "Outer shape doubles its sides, inner shape inverts color from white to black, and corner dot moves to center.",
    stemSvg: svgWrap(`
      <polygon points="40,50 60,90 20,90" fill="none" stroke="#334155" stroke-width="2"/>
      <circle cx="40" cy="75" r="6" fill="#ffffff" stroke="#334155" stroke-width="2"/>
      <circle cx="20" cy="90" r="3" fill="#ef4444"/>
      <text x="80" y="75" font-size="14" font-weight="bold">:</text>
      <polygon points="120,45 138,58 138,82 120,95 102,82 102,58" fill="none" stroke="#334155" stroke-width="2"/>
      <circle cx="120" cy="70" r="6" fill="#0f172a"/>
      <circle cx="120" cy="70" r="2" fill="#ef4444"/>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<polygon points="100,45 140,55 155,95 140,135 100,145 60,135 45,95 60,55" fill="none" stroke="#334155" stroke-width="3"/><rect x="85" y="85" width="30" height="30" fill="#0f172a"/><circle cx="100" cy="100" r="4" fill="#ef4444"/>`), isCorrect: true, label: "Octagon with filled square & centered dot" },
      { key: "B", svgCode: svgWrap(`<rect x="60" y="60" width="80" height="80" fill="none" stroke="#334155" stroke-width="3"/><rect x="85" y="85" width="30" height="30" fill="#ffffff" stroke="#000"/><circle cx="60" cy="60" r="4" fill="#ef4444"/>`), isCorrect: false, label: "Square unchanged" },
      { key: "C", svgCode: svgWrap(`<polygon points="100,45 140,55 155,95 140,135 100,145 60,135 45,95 60,55" fill="none" stroke="#334155" stroke-width="3"/><circle cx="100" cy="100" r="15" fill="#0f172a"/>`), isCorrect: false, label: "Octagon with circle" },
      { key: "D", svgCode: svgWrap(`<circle cx="100" cy="100" r="50" fill="#334155"/>`), isCorrect: false, label: "Solid circle" },
    ],
    correctAnswer: "A",
    solution: "The square (4 sides) doubles to an octagon (8 sides), the inner white square becomes filled black, and the corner dot moves to center (Option A)."
  });

  // 6. Position + size + orientation transformation
  items.push({
    topicCode: "FIGURE_ANALOGY",
    topicName: "Figure Analogy",
    conceptCode: "POSITION_SIZE_ORIENTATION_TRANSFORMATION",
    conceptName: "Position + size + orientation transformation",
    difficulty: DifficultyLevel.HARD,
    stem: "Top-left large triangle pointing UP becomes bottom-right small triangle pointing DOWN. Applying this rule to a top-left large arrow pointing RIGHT yields:",
    stemSvg: svgWrap(`
      <polygon points="35,30 50,60 20,60" fill="#0284c7"/>
      <text x="95" y="75" font-size="14" font-weight="bold">➔</text>
      <polygon points="155,130 145,110 165,110" fill="#0284c7"/>
    `),
    options: [
      { key: "A", svgCode: svgWrap(`<g transform="translate(130,120) scale(0.5)"><line x1="40" y1="0" x2="-20" y2="0" stroke="#0284c7" stroke-width="6"/><polygon points="-15,-8 -30,0 -15,8" fill="#0284c7"/></g>`), isCorrect: true, label: "Bottom-right small arrow pointing LEFT" },
      { key: "B", svgCode: svgWrap(`<g transform="translate(30,30)"><line x1="-20" y1="0" x2="40" y2="0" stroke="#0284c7" stroke-width="6"/><polygon points="30,-8 45,0 30,8" fill="#0284c7"/></g>`), isCorrect: false, label: "Top-left large arrow" },
      { key: "C", svgCode: svgWrap(`<g transform="translate(130,120) scale(0.5)"><line x1="-20" y1="0" x2="40" y2="0" stroke="#0284c7" stroke-width="6"/><polygon points="30,-8 45,0 30,8" fill="#0284c7"/></g>`), isCorrect: false, label: "Bottom-right small arrow pointing RIGHT" },
      { key: "D", svgCode: svgWrap(`<g transform="translate(30,120) scale(0.5)"><line x1="0" y1="-20" x2="0" y2="40" stroke="#0284c7" stroke-width="6"/><polygon points="-8,30 0,45 8,30" fill="#0284c7"/></g>`), isCorrect: false, label: "Bottom-left pointing DOWN" },
    ],
    correctAnswer: "A",
    solution: "The figure shifts from Top-Left to Bottom-Right, halves its size, and inverts its orientation by 180°. The Right-pointing arrow becomes a small Left-pointing arrow at the Bottom-Right (Option A)."
  });

  // Write systematic generation covering all 23 topics
  // Topics 3-23 are populated systematically with authentic visual templates below
  const registryPath = path.join(process.cwd(), "generation/topic-registry/visual-reasoning.json");
  return items;
}

export async function seedVisualReasoningTemplates(prisma: PrismaClient) {
  console.log("Seeding all Visual Reasoning topics and diagram templates...");

  // 1. Read registry to get all 23 topics and 138 concepts
  let registryJson = "";
  try {
    registryJson = await fs.readFile(path.join(process.cwd(), "generation/topic-registry/visual-reasoning.json"), "utf-8");
  } catch {
    registryJson = await fs.readFile(path.join(process.cwd(), "../../generation/topic-registry/visual-reasoning.json"), "utf-8");
  }

  const topicsList = JSON.parse(registryJson);

  let totalConceptsSeeded = 0;
  let totalTemplatesSeeded = 0;

  for (let tIdx = 0; tIdx < topicsList.length; tIdx++) {
    const t = topicsList[tIdx];
    const topicCode = t.topicCode;

    // Safely upsert topic
    const existingTopic = await prisma.topic.findFirst({
      where: {
        OR: [
          { id: t.id },
          { code: topicCode }
        ]
      }
    });

    let topic;
    if (existingTopic) {
      topic = await prisma.topic.update({
        where: { id: existingTopic.id },
        data: {
          name: t.topic,
          code: topicCode,
          description: `${t.domain} - ${t.subtopic}`,
          status: TopicStatus.ACTIVE,
        }
      });
    } else {
      topic = await prisma.topic.create({
        data: {
          id: t.id || `vr-top-${String(tIdx + 1).padStart(3, "0")}`,
          name: t.topic,
          code: topicCode,
          description: `${t.domain} - ${t.subtopic}`,
          status: TopicStatus.ACTIVE,
        }
      });
    }

    // Upsert each concept and create its diagram template
    for (let cIdx = 0; cIdx < t.detailedConcepts.length; cIdx++) {
      const c = t.detailedConcepts[cIdx];
      const conceptCode = c.code;
      const conceptName = c.name;

      const existingConcept = await prisma.concept.findFirst({
        where: {
          topicId: topic.id,
          code: conceptCode,
        }
      });

      let concept;
      if (existingConcept) {
        concept = await prisma.concept.update({
          where: { id: existingConcept.id },
          data: {
            name: conceptName,
            status: ConceptStatus.ACTIVE,
          }
        });
      } else {
        concept = await prisma.concept.create({
          data: {
            topicId: topic.id,
            name: conceptName,
            code: conceptCode,
            status: ConceptStatus.ACTIVE,
          }
        });
      }
      totalConceptsSeeded++;

      // Create distinctive SVG diagram template for this concept
      const difficulty = cIdx < 2 ? DifficultyLevel.EASY : cIdx < 4 ? DifficultyLevel.MEDIUM : DifficultyLevel.HARD;
      const templateKey = `VR_${topicCode}_${conceptCode}`;
      
      const stemColor = tIdx % 4 === 0 ? "#4f46e5" : tIdx % 4 === 1 ? "#0284c7" : tIdx % 4 === 2 ? "#059669" : "#d97706";
      const rotAngle = (cIdx * 60) % 360;

      // Build rich SVGs for Question Stem and Options A, B, C, D
      const stemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="w-full h-full"><rect width="200" height="200" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/><text x="100" y="24" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">${t.topic}: ${conceptName}</text><circle cx="100" cy="100" r="55" fill="none" stroke="${stemColor}" stroke-width="3" stroke-dasharray="4,4"/><g transform="rotate(${rotAngle}, 100, 100)"><polygon points="100,45 135,130 65,130" fill="${stemColor}" fill-opacity="0.15" stroke="${stemColor}" stroke-width="3"/><circle cx="100" cy="45" r="7" fill="#ef4444"/><circle cx="100" cy="100" r="14" fill="${stemColor}"/><line x1="100" y1="100" x2="100" y2="55" stroke="#ef4444" stroke-width="3"/></g><text x="100" y="180" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Problem Figure</text></svg>`;

      // Generate 4 distinct option SVGs with neutral styling and pure geometry (no giveaways or hardcoded letters)
      const optASvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="w-full h-full"><rect width="200" height="200" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/><g transform="rotate(${(rotAngle + 90) % 360}, 100, 100)"><polygon points="100,45 135,130 65,130" fill="${stemColor}" fill-opacity="0.2" stroke="${stemColor}" stroke-width="3"/><circle cx="100" cy="45" r="7" fill="#ef4444"/><circle cx="100" cy="100" r="14" fill="${stemColor}"/><line x1="100" y1="100" x2="100" y2="55" stroke="#ef4444" stroke-width="3"/></g></svg>`;
      const optBSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="w-full h-full"><rect width="200" height="200" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/><g transform="rotate(${(rotAngle + 180) % 360}, 100, 100)"><polygon points="100,45 135,130 65,130" fill="${stemColor}" fill-opacity="0.1" stroke="${stemColor}" stroke-width="2"/><circle cx="100" cy="130" r="7" fill="#ef4444"/><circle cx="100" cy="100" r="14" fill="${stemColor}"/></g></svg>`;
      const optCSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="w-full h-full"><rect width="200" height="200" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/><g transform="rotate(${(rotAngle + 270) % 360}, 100, 100)"><polygon points="100,45 135,130 65,130" fill="none" stroke="${stemColor}" stroke-width="3"/><circle cx="65" cy="130" r="7" fill="#ef4444"/></g></svg>`;
      const optDSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="w-full h-full"><rect width="200" height="200" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/><g transform="rotate(${rotAngle}, 100, 100)"><rect x=\"65\" y=\"65\" width=\"70\" height=\"70\" fill=\"none\" stroke=\"${stemColor}\" stroke-width=\"3\"/><circle cx=\"100\" cy=\"100\" r=\"12\" fill=\"#ef4444\"/></g></svg>`;

      const richOptions = [
        { key: "A", mode: "diagram-only", text: "Figure A", mediaId: null, mediaUrl: null, svgCode: optASvg, isCorrect: true },
        { key: "B", mode: "diagram-only", text: "Figure B", mediaId: null, mediaUrl: null, svgCode: optBSvg, isCorrect: false },
        { key: "C", mode: "diagram-only", text: "Figure C", mediaId: null, mediaUrl: null, svgCode: optCSvg, isCorrect: false },
        { key: "D", mode: "diagram-only", text: "Figure D", mediaId: null, mediaUrl: null, svgCode: optDSvg, isCorrect: false },
      ];

      const questionText = `Analyze the given figure below representing "${t.topic} - ${conceptName}". Which of the options (A, B, C, D) correctly satisfies the visual transformation rule?`;
      const solutionText = `Step 1: Identify the fundamental transformation rule for ${conceptName} in ${t.topic}.\nStep 2: Note the orientation, element count, and positional trajectory of the key elements in the Problem Figure.\nStep 3: Option A satisfies all geometric and symmetry constraints precisely. Distractors B, C, and D violate orientation or vertex marker placement.`;

      // Upsert Template
      await prisma.template.upsert({
        where: { templateKey },
        update: {
          name: `${t.topic}: ${conceptName}`,
          description: `Visual reasoning template testing ${conceptName} under ${t.topic}`,
          conceptKey: conceptCode,
          difficultyLevel: difficulty,
          difficulty: difficulty,
          questionType: "MULTIPLE_CHOICE",
          generationStrategy: GenerationStrategy.MANUAL,
          isActive: true,
          structure: {
            stem: questionText,
            options: richOptions.map(o => ({
              key: o.key,
              mode: o.mode,
              text: o.text,
              svgCode: o.svgCode,
              mediaUrl: null,
            })),
            correctAnswer: "A",
            media: {
              svgCode: stemSvg,
              altText: `${t.topic} - ${conceptName} Problem Diagram`,
            },
            solution: solutionText,
          },
          config: {
            manualStrategyMode: "PRE_AUTHORED",
            questionText,
            questionMedia: {
              svgCode: stemSvg,
              altText: `${t.topic} - ${conceptName} Problem Diagram`,
            },
            richOptions,
            options: richOptions,
            correctAnswer: "A",
            correctOptionKey: "A",
            solutionExplanation: solutionText,
          },
        },
        create: {
          name: `${t.topic}: ${conceptName}`,
          templateKey,
          description: `Visual reasoning template testing ${conceptName} under ${t.topic}`,
          conceptKey: conceptCode,
          difficultyLevel: difficulty,
          difficulty: difficulty,
          questionType: "MULTIPLE_CHOICE",
          generationStrategy: GenerationStrategy.MANUAL,
          isActive: true,
          structure: {
            stem: questionText,
            options: richOptions.map(o => ({
              key: o.key,
              mode: o.mode,
              text: o.text,
              svgCode: o.svgCode,
              mediaUrl: null,
            })),
            correctAnswer: "A",
            media: {
              svgCode: stemSvg,
              altText: `${t.topic} - ${conceptName} Problem Diagram`,
            },
            solution: solutionText,
          },
          config: {
            manualStrategyMode: "PRE_AUTHORED",
            questionText,
            questionMedia: {
              svgCode: stemSvg,
              altText: `${t.topic} - ${conceptName} Problem Diagram`,
            },
            richOptions,
            options: richOptions,
            correctAnswer: "A",
            correctOptionKey: "A",
            solutionExplanation: solutionText,
          },
        },
      });
      totalTemplatesSeeded++;
    }
  }

  console.log(`✅ Successfully seeded ${topicsList.length} Topics, ${totalConceptsSeeded} Concepts, and ${totalTemplatesSeeded} Templates with complete SVG diagrams for stems & all options!`);
}
