# API Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Components (App, ReviewCard)       │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                     │
│                     ▼                                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Custom Hooks Layer                       │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  • useSSE()           - Real-time updates        │   │
│  │  • useReview(id)      - Single review state      │   │
│  │  • useReviewsAction() - Create/update reviews    │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                     │
│                     ▼                                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │      API Service Layer (apiService)              │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  • fetchReviews()                                │   │
│  │  • fetchReview(id)                               │   │
│  │  • startReview(data)                             │   │
│  │  • addEvent(id, data)                            │   │
│  │  • completeReview(id, data)                      │   │
│  │  • healthCheck()                                 │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                     │
└─────────────────────┼─────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ┌─────────────┐          ┌──────────────┐
    │ SSE Events  │          │ REST API     │
    │ /api/events │          │ /api/reviews │
    └─────────────┘          └──────────────┘
         │                         │
         └────────────┬────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │   Backend Server         │
         │   (Express)              │
         │                          │
         │  • Reviews DB            │
         │  • Events DB             │
         │  • Broadcasting          │
         └──────────────────────────┘
```

## Data Flow

### 1. Real-time Updates (SSE)

```
Backend broadcasts event
    ↓
SSE stream sends to client
    ↓
useSSE hook receives event
    ↓
State updated (reviews)
    ↓
Components re-render
```

### 2. REST API Call

```
User action (form submission)
    ↓
useReviewsAction() called
    ↓
apiService method invoked
    ↓
HTTP request sent to backend
    ↓
Backend processes request
    ↓
Response received
    ↓
State updated & component re-renders
```

## Directory Structure

```
src/
├── services/
│   ├── api.ts              # 💡 Main API service - all HTTP calls here
│   └── index.ts            # Barrel export for easy imports
│
├── hooks/
│   ├── useSSE.ts           # 🔴 Real-time connection & events
│   ├── useReview.ts        # 📖 Fetch individual reviews
│   ├── useReviewsAction.ts # ✏️ Create/update reviews
│   └── index.ts            # Barrel export for easy imports
│
├── components/
│   ├── ReviewCard.tsx      # Display review
│   ├── EventTimeline.tsx   # Show events timeline
│   └── ReviewStarterExample.tsx  # 📚 Example component
│
├── API_INTEGRATION.md      # 📖 Complete API documentation
├── QUICK_START.md          # 🚀 Quick start guide
└── App.tsx                 # Enhanced with health checks
```

## Integration Points

### App Component

- ✅ Uses `useSSE()` for live reviews
- ✅ Health check monitoring
- ✅ Error state management
- ✅ Connection status display

### ReviewCard Component

- Uses `review` prop from `useSSE()`
- Can optionally use `useReview()` for detail page
- Can trigger actions via `useReviewsAction()`

### Custom Forms

- Use `useReviewsAction()` for form submissions
- Get loading state for button disabling
- Get error state for error messages

## API Methods Summary

| Method                     | Purpose             | Type | Returns                      |
| -------------------------- | ------------------- | ---- | ---------------------------- |
| `fetchReviews()`           | Get all reviews     | GET  | `PRReview[]`                 |
| `fetchReview(id)`          | Get single review   | GET  | `PRReview`                   |
| `startReview(data)`        | Create new review   | POST | `{id, message}`              |
| `addEvent(id, data)`       | Add event to review | POST | `{message}`                  |
| `completeReview(id, data)` | Mark review done    | POST | `{message}`                  |
| `healthCheck()`            | Check API status    | GET  | `{status, reviews, clients}` |

## Hook Features

### useSSE()

- Auto-connects on mount
- Auto-reconnects on disconnect
- Handles SSE events (start, event, complete)
- Returns `{reviews, connected}`
- No parameters needed

### useReview(id, options?)

- Fetches on mount (configurable)
- Returns `{review, loading, error, refetch}`
- Has manual refresh capability
- Single review focus

### useReviewsAction()

- No parameters on creation
- Returns `{loading, error, startReview, addEvent, completeReview, clearError}`
- Methods accept optional callbacks
- Handles error state

## Error Handling Strategy

```
API Call
   ↓
Try-Catch Wrapper
   ↓
┌─ Error → State Update → Render Error UI
│
└─ Success → State Update → Render Data
```

Features:

- ✅ All API methods have error handling
- ✅ Health checks detect connectivity issues
- ✅ Error banners show in UI
- ✅ Automatic reconnection for SSE
- ✅ Manual retry with `refetch()` or action methods

## Type Safety

All operations are fully typed:

- ✅ Parameters validated at TypeScript level
- ✅ Return types are precise
- ✅ IntelliSense support in IDEs
- ✅ Uses existing `PRReview` and `PREvent` types

## Configuration

```bash
# Environment variable
VITE_API_URL=http://localhost:3001

# Defaults to localhost:3001 if not set
```

## Best Practices

1. **Use `useSSE()`** for main review list
   - Handles real-time updates automatically
   - Less network traffic

2. **Use `useReview(id)`** for detail pages
   - Single review focus
   - Manual refresh control

3. **Use `useReviewsAction()`** for forms
   - Consistent loading/error states
   - Easy callback handling

4. **Check `connected` status** from `useSSE()`
   - Show user when offline
   - Handle gracefully

5. **Always wrap in try-catch** for direct API calls
   - Prevents unhandled promise rejections

## Performance Considerations

- ✅ SSE for real-time (single connection)
- ✅ REST for on-demand (caching-friendly)
- ✅ Health checks cached (30 seconds)
- ✅ Automatic reconnection without user intervention

## Extensibility

Easy to add new features:

- Add method to `apiService` for new endpoints
- Create new hook if needed
- Re-export from index files
- Add types to `types.ts`

## Testing

Mock the API service:

```typescript
import { apiService } from "@/services";

jest.mock("@/services", () => ({
  apiService: {
    fetchReviews: jest.fn(),
    // ... etc
  },
}));
```

## Debugging

Enable detailed logging:

```typescript
// In browser console
localStorage.debug = "*";
```

Check:

- Network tab for requests/responses
- Redux DevTools if you add Redux
- React Query DevTools if you add React Query
