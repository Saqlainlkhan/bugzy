import type { PREvent } from "../types";

interface EventTimelineProps {
  events: PREvent[];
  expanded?: boolean;
}

export function EventTimeline({
  events,
  expanded = false,
}: EventTimelineProps) {
  return (
    <div className="event-timeline">
      {events.map((event) => (
        <div key={event.id} className={`event-item ${event.type}`}>
          <div className="event-icon">
            {event.type === "complete" ? (
              <CheckIcon />
            ) : event.type === "error" ? (
              <ErrorIcon />
            ) : event.type === "review" ? (
              <ReviewIcon />
            ) : (
              <PendingIcon />
            )}
          </div>
          <div className="event-content">
            <span className="event-step">
              {event.data.step || event.data.message || event.type}
            </span>
            {event.data.duration !== undefined && (
              <span className="event-duration">{event.data.duration}s</span>
            )}
          </div>
          {expanded && event.data.review && (
            <div className="event-review">
              <pre>{event.data.review}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="var(--accent-green-soft)"
        stroke="var(--accent-green)"
        strokeWidth="1.5"
      />
      <path
        d="M8 12.5L10.5 15L16 9"
        stroke="var(--accent-green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="var(--accent-red-soft)"
        stroke="var(--accent-red)"
        strokeWidth="1.5"
      />
      <path
        d="M15 9L9 15M9 9L15 15"
        stroke="var(--accent-red)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="var(--accent-blue-soft)"
        stroke="var(--accent-blue)"
        strokeWidth="1.5"
      />
      <path
        d="M12 8V12L14.5 14.5"
        stroke="var(--accent-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="var(--surface-2)"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <circle cx="8" cy="12" r="1.5" fill="var(--text-muted)" />
      <circle cx="12" cy="12" r="1.5" fill="var(--text-muted)" />
      <circle cx="16" cy="12" r="1.5" fill="var(--text-muted)" />
    </svg>
  );
}
