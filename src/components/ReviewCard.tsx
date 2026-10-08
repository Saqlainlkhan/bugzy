import { useState, useEffect } from "react";
import type { PRReview } from "../types";
import { EventTimeline } from "./EventTimeline";
import { apiService } from "../services/api"; // Added import

interface ReviewCardProps {
  review: PRReview;
}

export function ReviewCard({ review: initialReview }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reviewData, setReviewData] = useState<PRReview>(initialReview);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with incoming prop changes (e.g., from SSE)
  useEffect(() => {
    setReviewData(initialReview);
  }, [initialReview]);

  // API Integration: Fetch the latest review data when expanding
  const toggleExpand = async () => {
    const willExpand = !expanded;
    setExpanded(willExpand);

    if (willExpand) {
      setIsLoading(true);
      try {
        const latestData = await apiService.fetchReview(reviewData.id);
        setReviewData(latestData);
      } catch (error) {
        console.error("Failed to fetch fresh review details", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // API Integration: Manually trigger an event
  const triggerManualEvent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.addEvent(reviewData.id, {
        type: "review",
        step: "Manual Intervention",
        message: "A developer manually triggered an event.",
      });
      // Re-fetch to show new event
      const updatedData = await apiService.fetchReview(reviewData.id);
      setReviewData(updatedData);
    } catch (error) {
      console.error("Failed to add manual event", error);
    }
  };

  // API Integration: Force Complete Review
  const forceCompleteReview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.completeReview(reviewData.id, {
        status: "completed",
        verdict: "APPROVE",
        review: "Manually approved by admin.",
      });
      // Re-fetch to show completion status
      const updatedData = await apiService.fetchReview(reviewData.id);
      setReviewData(updatedData);
    } catch (error) {
      console.error("Failed to force complete review", error);
    }
  };

  const verdictStyles = {
    APPROVE: {
      color: "var(--accent-green)",
      background: "var(--accent-green-soft)",
      borderColor: "rgba(16, 185, 129, 0.3)",
    },
    REQUEST_CHANGES: {
      color: "var(--accent-orange)",
      background: "var(--accent-orange-soft)",
      borderColor: "rgba(245, 158, 11, 0.3)",
    },
    COMMENT: {
      color: "var(--accent-blue)",
      background: "var(--accent-blue-soft)",
      borderColor: "rgba(59, 130, 246, 0.3)",
    },
  } as const;

  const currentVerdictStyle = reviewData.verdict
    ? verdictStyles[reviewData.verdict as keyof typeof verdictStyles]
    : null;

  const timeAgo = getTimeAgo(reviewData.createdAt);
  const duration = reviewData.completedAt
    ? getDuration(reviewData.createdAt, reviewData.completedAt)
    : "Analyzing...";

  return (
    <div className={`review-card ${reviewData.status}`}>
      <div className="review-header" onClick={toggleExpand}>
        <div className="review-title-section">
          <h3 className="review-title">
            <a
              href={reviewData.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {reviewData.prTitle ||
                `${reviewData.repo} #${reviewData.prNumber}`}
            </a>
          </h3>
          <div className="review-meta">
            <span className="badge repo-badge">{reviewData.repo}</span>
            <span className="badge pr-badge">#{reviewData.prNumber}</span>
            <span className={`badge status-${reviewData.status}`}>
              {reviewData.status}
            </span>
            {reviewData.verdict && currentVerdictStyle && (
              <span
                className="badge verdict-badge"
                style={{
                  color: currentVerdictStyle.color,
                  background: currentVerdictStyle.background,
                  borderColor: currentVerdictStyle.borderColor,
                  border: `1px solid ${currentVerdictStyle.borderColor}`,
                }}
              >
                {reviewData.verdict.replace("_", " ")}
              </span>
            )}
          </div>
          <div className="review-time">
            <span>{timeAgo}</span>
            <span className="separator">·</span>
            <span>{duration}</span>
          </div>
        </div>
        <div
          className="expand-icon"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronIcon />
        </div>
      </div>

      {expanded && (
        <div className="review-body">
          {isLoading && (
            <div className="loading-indicator">Loading latest details...</div>
          )}

          {/* Action buttons visible during review for demonstration */}
          {reviewData.status === "running" && (
            <div className="dev-actions">
              <button onClick={triggerManualEvent}>+ Mock Event</button>
              <button onClick={forceCompleteReview}>Force Complete</button>
            </div>
          )}

          <div className="review-events">
            <EventTimeline events={reviewData.events} expanded={true} />
          </div>

          {reviewData.review && (
            <div className="review-content">
              <h4>AI Analysis</h4>
              <div className="review-text">
                <pre>{reviewData.review}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {!expanded && reviewData.events?.length > 0 && (
        <div className="review-events-collapsed">
          <EventTimeline
            events={[reviewData.events[reviewData.events.length - 1]]}
          />
        </div>
      )}
    </div>
  );
}

// ChevronIcon, getTimeAgo, getDuration implementations remain unchanged...
function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
function getDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
