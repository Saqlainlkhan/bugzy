# Frontend API Integration Summary

## Overview

The frontend has been enhanced with a comprehensive API integration layer that includes:

- Centralized API service for all backend calls
- Reusable custom hooks for common operations
- Real-time SSE (Server-Sent Events) support
- Error handling and health monitoring
- TypeScript support with full type safety

## Files Created

### Services

- **`src/services/api.ts`** - Centralized API service with methods for all endpoints
- **`src/services/index.ts`** - Service exports

### Hooks

- **`src/hooks/useSSE.ts`** - Real-time SSE connection management (enhanced)
- **`src/hooks/useReview.ts`** - Hook for fetching individual reviews
- **`src/hooks/useReviewsAction.ts`** - Hook for creating/updating reviews
- **`src/hooks/index.ts`** - Hook exports for easy imports

### Components

- **`src/components/ReviewStarterExample.tsx`** - Example component showing how to use the APIs

### Documentation

- **`src/API_INTEGRATION.md`** - Complete API documentation with examples

## Files Modified

### `src/App.tsx`

- Added API health check functionality
- Added error state management for API failures
- Enhanced header with API status indicator
- Integrated error banner for API issues

### `src/hooks/useSSE.ts`

- Added import for new API service (ready for future enhancements)

## Key Features

### 1. **API Service (`apiService`)**

Provides methods for all backend endpoints:

- `fetchReviews()` - Get all reviews
- `fetchReview(id)` - Get single review
- `startReview(data)` - Start new review
- `addEvent(reviewId, data)` - Add event to review
- `completeReview(reviewId, data)` - Complete review
- `healthCheck()` - Check API status

### 2. **Custom Hooks**

- **`useSSE()`** - Manages real-time updates via SSE
- **`useReview(id)`** - Fetches and manages individual review state
- **`useReviewsAction()`** - Provides action methods with loading/error states

### 3. **Error Handling**

- All API calls wrapped in try-catch
- Automatic error state management
- Health check monitoring every 30 seconds
- User-friendly error messages

### 4. **Type Safety**

- Full TypeScript support
- All responses typed with existing interfaces
- IntelliSense support in editors

## Usage Examples

### Using the API Service

```typescript
import { apiService } from "@/services";

// Fetch all reviews
const reviews = await apiService.fetchReviews();

// Start a new review
const result = await apiService.startReview({
  repo: "owner/repo",
  prNumber: 123,
});
```

### Using Custom Hooks

```typescript
import { useReviewsAction, useSSE } from "@/hooks";

// In a component
const { reviews, connected } = useSSE();
const { loading, error, startReview } = useReviewsAction();

// Start a review
await startReview({
  repo: "owner/repo",
  prNumber: 123,
});
```

## Integration Points

### Real-time Updates (SSE)

The `useSSE` hook handles:

- Initial connection and data fetching
- Real-time review creation (`review:start`)
- Event streaming (`review:event`)
- Review completion (`review:complete`)
- Automatic reconnection on disconnect

### REST API Calls

Used for:

- Fetching review history
- Getting individual review details
- Creating new reviews
- Updating review status

## Environment Configuration

The API URL can be configured via environment variable:

```bash
VITE_API_URL=http://your-api-url:port
```

Defaults to `http://localhost:3001`

## Next Steps (Optional)

1. **Use the APIs in components** - Import hooks and services as needed
2. **Add error boundaries** - Wrap components with error boundaries
3. **Add caching** - Consider adding request caching for better performance
4. **Add request retries** - Implement retry logic for failed requests
5. **Testing** - Add unit tests for hooks and API service

## File Structure

```
src/
├── services/
│   ├── api.ts          # Centralized API service
│   └── index.ts        # Exports
├── hooks/
│   ├── useSSE.ts       # Real-time updates
│   ├── useReview.ts    # Single review fetching
│   ├── useReviewsAction.ts  # Review actions
│   └── index.ts        # Exports
├── components/
│   └── ReviewStarterExample.tsx  # Example component
├── API_INTEGRATION.md  # Full documentation
└── App.tsx            # Enhanced with health checks
```

## Backward Compatibility

All changes are backward compatible. The existing `useSSE` hook still works as before, but now has better integration with the centralized API service.
