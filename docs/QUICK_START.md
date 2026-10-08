# Quick Start Guide - Using the APIs

This guide shows you how to quickly use the integrated APIs in your components.

## 1. Using Real-time Updates

Display live PR reviews as they come in:

```tsx
import { useSSE } from "@/hooks";

export function ReviewsList() {
  const { reviews, connected } = useSSE();

  return (
    <div>
      <p>Status: {connected ? "🟢 Live" : "🔴 Connecting"}</p>
      {reviews.map((review) => (
        <div key={review.id}>
          <h3>{review.prTitle}</h3>
          <p>Status: {review.status}</p>
        </div>
      ))}
    </div>
  );
}
```

## 2. Fetching a Specific Review

Get details about a specific review:

```tsx
import { useReview } from "@/hooks";

export function ReviewDetail({ reviewId }: { reviewId: string }) {
  const { review, loading, error, refetch } = useReview(reviewId);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>{review?.prTitle}</h2>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## 3. Creating/Updating Reviews

Start a new review or perform actions:

```tsx
import { useReviewsAction } from "@/hooks";

export function StartReview() {
  const { loading, error, startReview, clearError } = useReviewsAction();

  const handleStart = async () => {
    clearError();
    try {
      const result = await startReview({
        repo: "myorg/myrepo",
        prNumber: 42,
        prTitle: "Add new feature",
      });
      console.log("Review started:", result.id);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      <button onClick={handleStart} disabled={loading}>
        {loading ? "Starting..." : "Start Review"}
      </button>
    </div>
  );
}
```

## 4. Direct API Calls

Use the API service directly for custom operations:

```tsx
import { apiService } from "@/services";

async function doSomething() {
  // Get all reviews
  const reviews = await apiService.fetchReviews();

  // Check API health
  const health = await apiService.healthCheck();
  console.log(`API is ${health.status}`);

  // Add an event to a review
  await apiService.addEvent("review-id", {
    type: "STEP",
    step: "Running linter",
    message: "ESLint check in progress",
  });

  // Complete a review
  await apiService.completeReview("review-id", {
    status: "COMPLETED",
    review: "Looks good!",
    verdict: "APPROVE",
  });
}
```

## 5. Error Handling Pattern

Handle errors gracefully:

```tsx
import { useReviewsAction } from "@/hooks";

export function SafeOperation() {
  const { loading, error, startReview, clearError } = useReviewsAction();

  const handleStart = async () => {
    clearError(); // Clear previous errors

    try {
      const result = await startReview(
        { repo: "org/repo", prNumber: 1 },
        {
          onSuccess: () => {
            console.log("Success!");
          },
          onError: (err) => {
            console.error("Operation failed:", err.message);
          },
        },
      );
    } catch (err) {
      // Error is already set in state via onError callback
    }
  };

  return (
    <>
      {error && (
        <div className="error-banner">
          {error.message}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <button onClick={handleStart} disabled={loading}>
        Start
      </button>
    </>
  );
}
```

## 6. Configuration

Set the API endpoint in your environment:

```bash
# .env.local
VITE_API_URL=http://localhost:3001

# Or for production
VITE_API_URL=https://api.example.com
```

## 7. Available Endpoints

| Hook/Method                   | Purpose               |
| ----------------------------- | --------------------- |
| `useSSE()`                    | Real-time updates     |
| `useReview(id)`               | Fetch specific review |
| `useReviewsAction()`          | Create/update reviews |
| `apiService.fetchReviews()`   | Get all reviews       |
| `apiService.fetchReview(id)`  | Get one review        |
| `apiService.startReview()`    | Create review         |
| `apiService.addEvent()`       | Add step/event        |
| `apiService.completeReview()` | Mark done             |
| `apiService.healthCheck()`    | Check API status      |

## 8. Import Shortcuts

Use the index files for clean imports:

```tsx
// Instead of:
import { useSSE } from "@/hooks/useSSE";
import { apiService } from "@/services/api";

// Write:
import { useSSE } from "@/hooks";
import { apiService } from "@/services";
```

## Tips

✅ Always wrap API calls in try-catch or use the error states  
✅ Use `useSSE()` for the main review list (it handles reconnection)  
✅ Use `useReviewsAction()` for form submissions  
✅ Use `useReview()` for detail pages  
✅ Check the `API_INTEGRATION.md` file for complete documentation

## Troubleshooting

**"Cannot find module"** - Make sure you're using the correct import path

```tsx
// ✅ Correct
import { useSSE } from "@/hooks";

// ❌ Wrong
import { useSSE } from "./hooks/useSSE";
```

**"API Error" message** - Check:

1. Backend server is running on the correct port
2. `VITE_API_URL` environment variable is set correctly
3. CORS is enabled on the backend

**Connection keeps dropping** - The `useSSE` hook automatically reconnects every 3 seconds

For more help, see `src/API_INTEGRATION.md`
