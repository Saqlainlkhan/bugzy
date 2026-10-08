import { useEffect, useState } from "react";
import { useSSE } from "./hooks/useSSE";
import { apiService } from "./services/api";
import { ReviewCard } from "./components/ReviewCard";
import "./App.css";

// Icons for stat cards
const LayersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const LoaderIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const GitPullRequestIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M13 6h3a2 2 0 0 1 2 2v7" />
    <line x1="6" y1="9" x2="6" y2="21" />
  </svg>
);

const InboxIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

function App() {
  const { reviews: sseReviews, connected } = useSSE();
  const [reviews, setReviews] = useState(sseReviews);

  // API Status State
  const [apiHealthy, setApiHealthy] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // New Review Form State
  const [repo, setRepo] = useState("");
  const [prNumber, setPrNumber] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  // Sync state with SSE hooks seamlessly
  useEffect(() => {
    setReviews(sseReviews);
  }, [sseReviews]);

  // Check API health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiService.healthCheck();
        setApiHealthy(true);
        setApiError(null);
      } catch (error) {
        setApiHealthy(false);
        setApiError(
          error instanceof Error ? error.message : "API health check failed",
        );
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch Initial/Historical Reviews manually
  const handleRefresh = async () => {
    try {
      const historicalReviews = await apiService.fetchReviews();
      setReviews(historicalReviews);
    } catch (error) {
      console.error("Failed to refresh reviews:", error);
    }
  };

  // Start a new Review
  const handleStartReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo || !prNumber) return;

    setIsStarting(true);
    try {
      await apiService.startReview({
        repo,
        prNumber: parseInt(prNumber, 10),
      });
      setRepo("");
      setPrNumber("");
      // Optionally trigger a refresh to see the new item immediately
      await handleRefresh();
    } catch (error) {
      console.error("Failed to start review", error);
    } finally {
      setIsStarting(false);
    }
  };

  const runningCount = reviews.filter((r) => r.status === "running").length;
  const completedCount = reviews.filter((r) => r.status === "completed").length;
  const failedCount = reviews.filter((r) => r.status === "failed").length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon">
              <GitPullRequestIcon />
            </span>
            Bugzy
          </h1>
          <div className="connection-status">
            <span
              className={`status-dot ${connected ? "connected" : "disconnected"}`}
            />
            <span>{connected ? "Live" : "Connecting..."}</span>
            {!apiHealthy && <span className="api-status-error">API Error</span>}
          </div>
        </div>
        {apiError && <div className="api-error-banner">{apiError}</div>}
      </header>

      <main className="main">
        {/* Form to Start a Review */}
        <section className="controls-section" style={{ marginBottom: "24px" }}>
          <form
            className="start-review-form"
            onSubmit={handleStartReview}
            style={{ display: "flex", gap: "12px" }}
          >
            <input
              type="text"
              placeholder="Repo (e.g. facebook/react)"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              required
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
              }}
            />
            <input
              type="number"
              placeholder="PR Number"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              required
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                width: "120px",
              }}
            />
            <button
              type="submit"
              disabled={isStarting || !apiHealthy}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "var(--accent-blue)",
                color: "white",
                border: "none",
                cursor: isStarting || !apiHealthy ? "not-allowed" : "pointer",
                opacity: isStarting || !apiHealthy ? 0.7 : 1,
              }}
            >
              {isStarting ? "Starting..." : "Start Review"}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              Refresh History
            </button>
          </form>
        </section>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon total">
                <LayersIcon />
              </div>
            </div>
            <span className="stat-value total">{reviews.length}</span>
            <span className="stat-label">Total Reviews</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon running">
                <LoaderIcon />
              </div>
            </div>
            <span className="stat-value running">{runningCount}</span>
            <span className="stat-label">Running</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon completed">
                <CheckCircleIcon />
              </div>
            </div>
            <span className="stat-value completed">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon failed">
                <AlertCircleIcon />
              </div>
            </div>
            <span className="stat-value failed">{failedCount}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>

        <section className="reviews-section">
          <h2>Recent Activity</h2>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <InboxIcon />
              </div>
              <p>Waiting for PR events...</p>
              <p className="empty-hint">
                When a pull request is created, real-time analysis will appear
                here.
              </p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
  