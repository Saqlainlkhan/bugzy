import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// SSE clients
const sseClients: Set<express.Response> = new Set();

// Broadcast event to all SSE clients
function broadcast(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    client.write(message);
  });
}

// SSE endpoint for real-time updates
app.get("/api/events", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send initial data
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "Connected to SSE" })}\n\n`);

  // Send all existing reviews from database
  try {
    const reviews = await prisma.review.findMany({
      include: { events: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      repo: r.repo,
      prNumber: r.prNumber,
      prTitle: r.prTitle,
      prUrl: r.prUrl,
      status: r.status.toLowerCase(),
      review: r.review,
      verdict: r.verdict,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString(),
      events: r.events.map((e) => ({
        id: e.id,
        type: e.type.toLowerCase(),
        timestamp: e.timestamp.toISOString(),
        data: {
          step: e.step,
          duration: e.duration,
          message: e.message,
          review: e.review,
          verdict: e.verdict,
        },
      })),
    }));

    res.write(`event: init\ndata: ${JSON.stringify({ reviews: formattedReviews })}\n\n`);
  } catch (error) {
    console.error("Error fetching reviews for SSE:", error);
    res.write(`event: init\ndata: ${JSON.stringify({ reviews: [] })}\n\n`);
  }

  sseClients.add(res);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Get all reviews
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { events: true },
      orderBy: { createdAt: "desc" },
    });

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      repo: r.repo,
      prNumber: r.prNumber,
      prTitle: r.prTitle,
      prUrl: r.prUrl,
      status: r.status.toLowerCase(),
      review: r.review,
      verdict: r.verdict,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString(),
      events: r.events.map((e) => ({
        id: e.id,
        type: e.type.toLowerCase(),
        timestamp: e.timestamp.toISOString(),
        data: {
          step: e.step,
          duration: e.duration,
          message: e.message,
          review: e.review,
          verdict: e.verdict,
        },
      })),
    }));

    res.json({ reviews: formattedReviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get single review
app.get("/api/reviews/:id", async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: { events: true },
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({
      id: review.id,
      repo: review.repo,
      prNumber: review.prNumber,
      prTitle: review.prTitle,
      prUrl: review.prUrl,
      status: review.status.toLowerCase(),
      review: review.review,
      verdict: review.verdict,
      createdAt: review.createdAt.toISOString(),
      completedAt: review.completedAt?.toISOString(),
      events: review.events.map((e) => ({
        id: e.id,
        type: e.type.toLowerCase(),
        timestamp: e.timestamp.toISOString(),
        data: {
          step: e.step,
          duration: e.duration,
          message: e.message,
          review: e.review,
          verdict: e.verdict,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Start a new PR review (called from GitHub Actions)
app.post("/api/reviews/start", async (req, res) => {
  const { repo, prNumber, prTitle, prUrl } = req.body;

  if (!repo || !prNumber) {
    return res.status(400).json({ error: "Missing repo or prNumber" });
  }

  try {
    const review = await prisma.review.create({
      data: {
        repo,
        prNumber: Number(prNumber),
        prTitle: prTitle || `PR #${prNumber}`,
        prUrl: prUrl || `https://github.com/${repo}/pull/${prNumber}`,
        status: "RUNNING",
        events: {
          create: {
            type: "STEP",
            step: "Set up job",
            duration: 0,
          },
        },
      },
      include: { events: true },
    });

    const formattedReview = {
      id: review.id,
      repo: review.repo,
      prNumber: review.prNumber,
      prTitle: review.prTitle,
      prUrl: review.prUrl,
      status: review.status.toLowerCase(),
      review: review.review,
      verdict: review.verdict,
      createdAt: review.createdAt.toISOString(),
      completedAt: review.completedAt?.toISOString(),
      events: review.events.map((e) => ({
        id: e.id,
        type: e.type.toLowerCase(),
        timestamp: e.timestamp.toISOString(),
        data: {
          step: e.step,
          duration: e.duration,
          message: e.message,
          review: e.review,
          verdict: e.verdict,
        },
      })),
    };

    broadcast("review:start", formattedReview);

    console.log(`[${new Date().toISOString()}] Started review: ${review.id}`);
    res.json({ id: review.id, message: "Review started" });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Add event to a review (called from GitHub Actions)
app.post("/api/reviews/:id/event", async (req, res) => {
  const { type, step, duration, message, review: reviewContent, verdict } = req.body;

  try {
    // Verify review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: req.params.id },
    });

    if (!existingReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        reviewId: req.params.id,
        type: (type?.toUpperCase() || "STEP") as "STEP" | "REVIEW" | "ERROR" | "COMPLETE",
        step,
        duration: duration || 0,
        message,
        review: reviewContent,
        verdict,
      },
    });

    // Update review if review content or verdict provided
    if (reviewContent || verdict) {
      await prisma.review.update({
        where: { id: req.params.id },
        data: {
          ...(reviewContent && { review: reviewContent }),
          ...(verdict && { verdict }),
        },
      });
    }

    const formattedEvent = {
      id: event.id,
      type: event.type.toLowerCase(),
      timestamp: event.timestamp.toISOString(),
      data: {
        step: event.step,
        duration: event.duration,
        message: event.message,
        review: event.review,
        verdict: event.verdict,
      },
    };

    broadcast("review:event", { reviewId: req.params.id, event: formattedEvent });

    console.log(`[${new Date().toISOString()}] Event for ${req.params.id}: ${type} - ${step || message}`);
    res.json({ message: "Event added" });
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).json({ error: "Failed to add event" });
  }
});

// Complete a review (called from GitHub Actions)
app.post("/api/reviews/:id/complete", async (req, res) => {
  const { status, review: reviewContent, verdict } = req.body;

  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        status: (status?.toUpperCase() || "COMPLETED") as "RUNNING" | "COMPLETED" | "FAILED",
        completedAt: new Date(),
        ...(reviewContent && { review: reviewContent }),
        ...(verdict && { verdict }),
        events: {
          create: {
            type: "COMPLETE",
            step: "Complete job",
            duration: 0,
          },
        },
      },
      include: { events: true },
    });

    const formattedReview = {
      id: review.id,
      repo: review.repo,
      prNumber: review.prNumber,
      prTitle: review.prTitle,
      prUrl: review.prUrl,
      status: review.status.toLowerCase(),
      review: review.review,
      verdict: review.verdict,
      createdAt: review.createdAt.toISOString(),
      completedAt: review.completedAt?.toISOString(),
      events: review.events.map((e) => ({
        id: e.id,
        type: e.type.toLowerCase(),
        timestamp: e.timestamp.toISOString(),
        data: {
          step: e.step,
          duration: e.duration,
          message: e.message,
          review: e.review,
          verdict: e.verdict,
        },
      })),
    };

    broadcast("review:complete", formattedReview);

    console.log(`[${new Date().toISOString()}] Completed review: ${review.id} - ${review.status}`);
    res.json({ message: "Review completed" });
  } catch (error) {
    console.error("Error completing review:", error);
    res.status(500).json({ error: "Failed to complete review" });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const reviewCount = await prisma.review.count();
    res.json({ status: "ok", reviews: reviewCount, clients: sseClients.size });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`PR Review API server running on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/api/events`);
});
