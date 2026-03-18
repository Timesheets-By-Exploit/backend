import request from "supertest";
import express from "express";
import { rateLimit } from "express-rate-limit";

// Build a minimal app with rate limiting enabled (no test skip) and a low
// limit so the test doesn't need to fire hundreds of requests.
const limiterApp = express();
limiterApp.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
limiterApp.get("/api/health", (_req, res) => res.json({ status: "ok" }));

describe("Rate Limiting", () => {
  it("should return 429 when rate limit is exceeded", async () => {
    const requests = Array.from({ length: 10 }, () =>
      request(limiterApp).get("/api/health"),
    );

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter((res) => res.status === 429);

    expect(tooManyRequests.length).toBeGreaterThan(0);
  });
});
