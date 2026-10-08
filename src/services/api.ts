import type { PRReview } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const apiService = {
  /**
   * Fetch all reviews from the server
   */
  async fetchReviews(): Promise<PRReview[]> {
    try {
      const response = await fetch(`${API_URL}/api/reviews`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }
      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw error;
    }
  },

  /**
   * Fetch a single review by ID
   */
  async fetchReview(id: string): Promise<PRReview> {
    try {
      const response = await fetch(`${API_URL}/api/reviews/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Review not found");
        }
        throw new Error(`Failed to fetch review: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching review ${id}:`, error);
      throw error;
    }
  },

  /**
   * Start a new PR review
   */
  async startReview(data: {
    repo: string;
    prNumber: number;
    prTitle?: string;
    prUrl?: string;
  }): Promise<{ id: string; message: string }> {
    try {
      const response = await fetch(`${API_URL}/api/reviews/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to start review: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error starting review:", error);
      throw error;
    }
  },

  /**
   * Add an event to a review
   */
  async addEvent(
    reviewId: string,
    data: {
      type?: string;
      step?: string;
      duration?: number;
      message?: string;
      review?: string;
      verdict?: string;
    },
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to add event: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error adding event:", error);
      throw error;
    }
  },

  /**
   * Complete a review
   */
  async completeReview(
    reviewId: string,
    data: {
      status?: string;
      review?: string;
      verdict?: string;
    },
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_URL}/api/reviews/${reviewId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to complete review: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error completing review:", error);
      throw error;
    }
  },

  /**
   * Check API health status
   */
  async healthCheck(): Promise<{
    status: string;
    reviews: number;
    clients: number;
  }> {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Health check error:", error);
      throw error;
    }
  },
};
