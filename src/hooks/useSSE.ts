import { useEffect, useRef, useState, useCallback } from "react";
import type { PRReview, PREvent } from "../types";
import { apiService } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useSSE() {
  const [reviews, setReviews] = useState<PRReview[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_URL}/api/events`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", () => {
      setConnected(true);
      console.log("SSE connected");
    });

    eventSource.addEventListener("init", (e) => {
      const data = JSON.parse(e.data);
      setReviews(data.reviews || []);
    });

    eventSource.addEventListener("review:start", (e) => {
      const review = JSON.parse(e.data) as PRReview;
      setReviews((prev) => [review, ...prev]);
    });

    eventSource.addEventListener("review:event", (e) => {
      const { reviewId, event } = JSON.parse(e.data) as {
        reviewId: string;
        event: PREvent;
      };
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                events: [...r.events, event],
                review: event.data.review || r.review,
                verdict: event.data.verdict || r.verdict,
              }
            : r,
        ),
      );
    });

    eventSource.addEventListener("review:complete", (e) => {
      const review = JSON.parse(e.data) as PRReview;
      setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
    });

    eventSource.onerror = () => {
      setConnected(false);
      console.log("SSE disconnected, reconnecting...");
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { reviews, connected };
}
