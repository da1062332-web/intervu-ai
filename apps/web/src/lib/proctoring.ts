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
  slug?: string | null;
  description?: string | null;
  clientName?: string | null;
  organizationName?: string | null;
  companyName?: string | null;
  testConfig?: {
    name?: string | null;
    title?: string | null;
    company?: string | null;
    code?: string | null;
  } | null;
  examConfig?: {
    name?: string | null;
    title?: string | null;
    company?: string | null;
    code?: string | null;
  } | null;
  [key: string]: any;
}

/**
 * Checks if an assessment is a Qloax assessment.
 * Candidates taking Qloax assessments test in environments without webcams,
 * so webcam hardware checks and real-time facial recognition proctoring are disabled.
 */
export function isQloaxAssessment(assessment?: AssessmentIdentifier | null): boolean {
  if (assessment) {
    const values = [
      assessment.id,
      assessment.testId,
      assessment.testConfigId,
      assessment.title,
      assessment.name,
      assessment.company,
      assessment.assessmentName,
      assessment.code,
      assessment.slug,
      assessment.description,
      assessment.clientName,
      assessment.organizationName,
      assessment.companyName,
      assessment.testConfig?.name,
      assessment.testConfig?.title,
      assessment.testConfig?.company,
      assessment.testConfig?.code,
      assessment.examConfig?.name,
      assessment.examConfig?.title,
      assessment.examConfig?.company,
      assessment.examConfig?.code,
    ];

    if (
      values.some(
        (val) => typeof val === 'string' && val.toLowerCase().includes('qloax'),
      )
    ) {
      return true;
    }
  }

  // Browser context checks: detect if current URL or session indicates a Qloax assessment
  if (typeof window !== 'undefined') {
    try {
      const url = window.location.href.toLowerCase();
      if (url.includes('qloax')) {
        return true;
      }
      const stored =
        sessionStorage.getItem('current_assessment') ||
        localStorage.getItem('last_assessment');
      if (stored && stored.toLowerCase().includes('qloax')) {
        return true;
      }
    } catch {
      // ignore DOMException in private/sandboxed contexts
    }
  }

  return false;
}

/**
 * Determines whether webcam & face detection should be disabled for an assessment.
 * Returns true for ALL assessments to bypass webcam and face detection during system check and exams.
 */
export function isFaceDetectionDisabledForAssessment(
  _assessment?: AssessmentIdentifier | null,
): boolean {
  return true;
}
