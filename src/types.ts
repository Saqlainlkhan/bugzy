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
