import request from "supertest";
import app from "@app";

describe("Rate Limiting", () => {
  it("should return 429 when rate limit is exceeded", async () => {
    const requests = Array.from({ length: 110 }, () =>
      request(app).get("/api/health"),
    );

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter((res) => res.status === 429);

    expect(tooManyRequests.length).toBeGreaterThan(0);
  });
});
