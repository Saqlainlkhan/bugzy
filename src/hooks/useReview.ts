import { useEffect, useState, useCallback } from "react";
import type { PRReview } from "../types";
import { apiService } from "../services/api";

interface UseReviewOptions {
  fetchOnMount?: boolean;
}

export function useReview(reviewId: string, options: UseReviewOptions = {}) {
  const { fetchOnMount = true } = options;
  const [review, setReview] = useState<PRReview | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const fetchReview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.fetchReview(reviewId);
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchReview();
    }
  }, [fetchReview, fetchOnMount]);

  return { review, loading, error, refetch: fetchReview };
}
