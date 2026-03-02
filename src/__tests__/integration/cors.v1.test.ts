import request from "supertest";
import app from "@app";

describe("CORS Configuration", () => {
  const allowedOrigin = "http://localhost:3000";
  const disallowedOrigin = "http://malicious-site.com";

  it("should allow requests from an allowed origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", allowedOrigin);

    expect(res.headers["access-control-allow-origin"]).toBe(allowedOrigin);
  });

  it("should NOT allow requests from unauthorized origins", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", disallowedOrigin);

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
