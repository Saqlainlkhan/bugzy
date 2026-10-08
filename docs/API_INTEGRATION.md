# Frontend API Integration

This document describes how the frontend integrates with the backend APIs.

## API Service (`src/services/api.ts`)

The `apiService` module provides a centralized interface for all API calls:

### Methods

#### `fetchReviews(): Promise<PRReview[]>`

Fetches all reviews from the server.

```typescript
import { apiService } from "@/services/api";

const reviews = await apiService.fetchReviews();
```

#### `fetchReview(id: string): Promise<PRReview>`

Fetches a single review by ID.

```typescript
const review = await apiService.fetchReview("review-123");
```

#### `startReview(data): Promise<{id: string, message: string}>`

Starts a new PR review.

```typescript
const result = await apiService.startReview({
  repo: "owner/repo",
  prNumber: 123,
  prTitle: "Add feature",
  prUrl: "https://github.com/owner/repo/pull/123",
});
```

#### `addEvent(reviewId, data): Promise<{message: string}>`

Adds an event to a review.

```typescript
await apiService.addEvent("review-123", {
  type: "STEP",
  step: "Running tests",
  duration: 30,
  message: "Tests completed successfully",
});
```

#### `completeReview(reviewId, data): Promise<{message: string}>`

Completes a review.

```typescript
await apiService.completeReview("review-123", {
  status: "COMPLETED",
  review: "Code looks good",
  verdict: "APPROVE",
});
```

#### `healthCheck(): Promise<{status, reviews, clients}>`

Checks API health status.

```typescript
const health = await apiService.healthCheck();
console.log(`API Status: ${health.status}, Reviews: ${health.reviews}`);
```

## Custom Hooks

### `useSSE()`

Manages Server-Sent Events (SSE) connection for real-time updates.

```typescript
import { useSSE } from '@/hooks';

function MyComponent() {
  const { reviews, connected } = useSSE();

  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      <p>Reviews: {reviews.length}</p>
    </div>
  );
}
```

**Returns:**

- `reviews: PRReview[]` - Array of all reviews
- `connected: boolean` - Connection status

### `useReview(reviewId, options?)`

Fetches and manages a single review.

```typescript
import { useReview } from '@/hooks';

function ReviewDetail({ reviewId }: { reviewId: string }) {
  const { review, loading, error, refetch } = useReview(reviewId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{review?.prTitle}</h2>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

**Options:**

- `fetchOnMount?: boolean` (default: `true`) - Whether to fetch on component mount

**Returns:**

- `review: PRReview | null` - The review data
- `loading: boolean` - Loading state
- `error: Error | null` - Error if any
- `refetch: () => Promise<void>` - Function to manually refresh

### `useReviewsAction()`

Provides methods to perform actions on reviews.

```typescript
import { useReviewsAction } from '@/hooks';

function ReviewActions() {
  const {
    loading,
    error,
    startReview,
    addEvent,
    completeReview,
    clearError
  } = useReviewsAction();

  const handleStart = async () => {
    try {
      const result = await startReview({
        repo: 'owner/repo',
        prNumber: 123
      });
      console.log('Review started:', result.id);
    } catch (err) {
      console.error('Failed to start review:', err);
    }
  };

  return (
    <div>
      {error && <p>{error.message}</p>}
      <button onClick={handleStart} disabled={loading}>
        {loading ? 'Starting...' : 'Start Review'}
      </button>
    </div>
  );
}
```

**Returns:**

- `loading: boolean` - Whether an action is in progress
- `error: Error | null` - Error from last action
- `startReview(data, options?)` - Start a review
- `addEvent(reviewId, data, options?)` - Add event to review
- `completeReview(reviewId, data, options?)` - Complete a review
- `clearError()` - Clear error state

**Options for all actions:**

- `onSuccess?: () => void` - Callback on success
- `onError?: (error: Error) => void` - Callback on error

## Environment Variables

Configure the API URL using environment variables:

```bash
# .env or .env.local
VITE_API_URL=http://localhost:3001
```

If not set, defaults to `http://localhost:3001`.

## Error Handling

All API methods include error handling:

```typescript
try {
  const review = await apiService.fetchReview("invalid-id");
} catch (error) {
  console.error("Failed to fetch review:", error);
}
```

The App component also includes:

- API health monitoring (checks every 30 seconds)
- Connection status display
- API error banner when health check fails

## API Endpoints Reference

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| GET    | `/api/reviews`              | Get all reviews                    |
| GET    | `/api/reviews/:id`          | Get single review                  |
| GET    | `/api/events`               | SSE endpoint for real-time updates |
| POST   | `/api/reviews/start`        | Start a new review                 |
| POST   | `/api/reviews/:id/event`    | Add event to review                |
| POST   | `/api/reviews/:id/complete` | Complete a review                  |
| GET    | `/api/health`               | Health check                       |

## Types

All API operations use TypeScript types defined in `src/types.ts`:

```typescript
export interface PRReview {
  id: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  status: "running" | "completed" | "failed";
  events: PREvent[];
  review?: string;
  verdict?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PREvent {
  id: string;
  type: "step" | "review" | "error" | "complete";
  timestamp: string;
  data: {
    step?: string;
    duration?: number;
    message?: string;
    review?: string;
    verdict?: string;
  };
}
```
