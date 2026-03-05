import request from "supertest";
import app from "@app";

describe("Security Headers", () => {
  it("should have various security headers set by helmet", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");
    expect(res.headers["expect-ct"]).toBeUndefined(); // This one might vary depending on helmet version
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["strict-transport-security"]).toBeDefined();
    expect(res.headers["x-download-options"]).toBe("noopen");
    expect(res.headers["x-permitted-cross-domain-policies"]).toBe("none");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
  });
});
