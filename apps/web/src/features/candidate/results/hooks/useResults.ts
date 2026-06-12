import { useEffect, useMemo } from 'react';
import { useResultsStore } from '../stores/results.store';
import { resultsService } from '../services/results.service';

export function useResults(id: string | undefined) {
  const {
    evaluation,
    skills,
    recommendations,
    performanceSummary,
    loading,
    error,
    setResults,
    setRecommendations,
    setPerformanceSummary,
    setLoading,
    setError,
  } = useResultsStore();

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [resultsData, recommendationsData, summaryData] = await Promise.all([
          resultsService.getResults(id),
          resultsService.getRecommendations(id),
          resultsService.getPerformanceSummary(),
        ]);

        const { skills: extractedSkills, ...evalData } = resultsData;
        setResults(evalData, extractedSkills);
        setRecommendations(recommendationsData);
        setPerformanceSummary(summaryData);
      } catch {
        setError('Unable to load results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, setResults, setRecommendations, setPerformanceSummary, setLoading, setError]);

  // Derived state: Strengths (Top 2 or score > 80)
  const strengths = useMemo(() => {
    if (!skills.length) return [];
    return [...skills]
      .filter((s) => s.score >= 70) // threshold for strength
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [skills]);

  // Derived state: Weaknesses (Bottom 2 or score < 60)
  const weaknesses = useMemo(() => {
    if (!skills.length) return [];
    return [...skills]
      .filter((s) => s.score < 60) // threshold for weakness
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [skills]);

  return {
    evaluation,
    skills,
    recommendations,
    performanceSummary,
    strengths,
    weaknesses,
    loading,
    error,
  };
}
