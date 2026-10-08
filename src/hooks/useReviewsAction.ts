import { useState, useCallback } from "react";
import { apiService } from "../services/api";

interface UseReviewsActionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useReviewsAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startReview = useCallback(
    async (
      data: {
        repo: string;
        prNumber: number;
        prTitle?: string;
        prUrl?: string;
      },
      options?: UseReviewsActionOptions,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.startReview(data);
        options?.onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const addEvent = useCallback(
    async (
      reviewId: string,
      data: {
        type?: string;
        step?: string;
        duration?: number;
        message?: string;
        review?: string;
        verdict?: string;
      },
      options?: UseReviewsActionOptions,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.addEvent(reviewId, data);
        options?.onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const completeReview = useCallback(
    async (
      reviewId: string,
      data: { status?: string; review?: string; verdict?: string },
      options?: UseReviewsActionOptions,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.completeReview(reviewId, data);
        options?.onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    startReview,
    addEvent,
    completeReview,
    clearError,
  };
}
