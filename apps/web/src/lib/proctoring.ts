/**
 * Utility functions for assessment proctoring and hardware requirements.
 */

export interface AssessmentIdentifier {
  id?: string | null;
  testId?: string | null;
  testConfigId?: string | null;
  title?: string | null;
  name?: string | null;
  company?: string | null;
  assessmentName?: string | null;
  code?: string | null;
}

/**
 * Checks if an assessment is a Qloax assessment.
 * Candidates taking Qloax assessments test in environments without webcams,
 * so webcam hardware checks and real-time facial recognition proctoring are disabled.
 */
export function isQloaxAssessment(assessment?: AssessmentIdentifier | null): boolean {
  if (!assessment) return false;
  const values = [
    assessment.id,
    assessment.testId,
    assessment.testConfigId,
    assessment.title,
    assessment.name,
    assessment.company,
    assessment.assessmentName,
    assessment.code,
  ];

  return values.some(
    (val) => typeof val === 'string' && val.toLowerCase().includes('qloax'),
  );
}

/**
 * Determines whether webcam & face detection should be disabled for an assessment.
 */
export function isFaceDetectionDisabledForAssessment(
  assessment?: AssessmentIdentifier | null,
): boolean {
  return isQloaxAssessment(assessment);
}
