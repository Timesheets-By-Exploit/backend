import request from "supertest";
import app from "@app";
import { clearDB } from "@tests/utils";
import { seedOneUserWithOrg, seedUserInOrg } from "@tests/helpers/seed";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "../../../auth/__tests__/helpers/testHelpers";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";

const { verifiedUserEmail } = TEST_CONSTANTS;

describe("Client Module Integration Tests", () => {
  let ownerToken: string;
  let managerToken: string;
  let memberToken: string;
  let viewerToken: string;
  let orgId: string;

  beforeEach(async () => {
    await clearDB();

    // Seed owner and organization
    const { user: owner, organization } = await seedOneUserWithOrg(
      {
        email: verifiedUserEmail,
        isEmailVerified: true,
      },
      {},
      "OWNER",
    );
    orgId = organization._id.toString();
    ownerToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: owner._id.toString(), email: owner.email }),
    );

    // Seed manager
    const { user: manager } = await seedUserInOrg(
      orgId,
      { email: "manager@example.com" },
      "MANAGER",
    );
    managerToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: manager._id.toString(), email: manager.email }),
    );

    // Seed member
    const { user: member } = await seedUserInOrg(
      orgId,
      { email: "member@example.com" },
      "MEMBER",
    );
    memberToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: member._id.toString(), email: member.email }),
    );

    // Seed viewer
    const { user: viewer } = await seedUserInOrg(
      orgId,
      { email: "viewer@example.com" },
      "VIEWER",
    );
    viewerToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: viewer._id.toString(), email: viewer.email }),
    );
  });

  describe("POST /api/v1/clients", () => {
    const clientData = {
      name: "Acme Corp",
      email: "billing@acme.com",
      currency: "USD",
      orgId: "", // Will be set in tests
    };

    it("should allow OWNER to create a new client", async () => {
      const res = await request(app)
        .post("/api/v1/clients")
        .set("Cookie", [ownerToken])
        .send({ ...clientData, orgId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should allow MANAGER to create a new client", async () => {
      const res = await request(app)
        .post("/api/v1/clients")
        .set("Cookie", [managerToken])
        .send({ ...clientData, orgId });

      expect(res.status).toBe(201);
    });

    it("should deny MEMBER from creating a client", async () => {
      const res = await request(app)
        .post("/api/v1/clients")
        .set("Cookie", [memberToken])
        .send({ ...clientData, orgId });

      expect(res.status).toBe(403);
    });

    it("should deny VIEWER from creating a client", async () => {
      const res = await request(app)
        .post("/api/v1/clients")
        .set("Cookie", [viewerToken])
        .send({ ...clientData, orgId });

      expect(res.status).toBe(403);
    });

    it("should return 400 if name is missing", async () => {
      const res = await request(app)
        .post("/api/v1/clients")
        .set("Cookie", [ownerToken])
        .send({ orgId });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/clients", () => {
    beforeEach(async () => {
      const ClientModel = (await import("@modules/client/client.model"))
        .default;
      await new ClientModel({ name: "Client 1", orgId }).save();
    });

    it("should allow MEMBER to get all clients for organization", async () => {
      const res = await request(app)
        .get("/api/v1/clients")
        .set("Cookie", [memberToken]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it("should allow VIEWER to get all clients for organization", async () => {
      const res = await request(app)
        .get("/api/v1/clients")
        .set("Cookie", [viewerToken]);

      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/v1/clients/:id", () => {
    let clientId: string;

    beforeEach(async () => {
      const ClientModel = (await import("@modules/client/client.model"))
        .default;
      const client = await new ClientModel({
        name: "Old Client",
        orgId,
      }).save();
      clientId = client.id.toString();
    });

    it("should allow MANAGER to update client info", async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${clientId}`)
        .set("Cookie", [managerToken])
        .send({ name: "New Client" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Client");
    });

    it("should deny MEMBER from updating client info", async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${clientId}`)
        .set("Cookie", [memberToken])
        .send({ name: "Unauthorized Update" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/clients/:id", () => {
    let clientId: string;

    beforeEach(async () => {
      const ClientModel = (await import("@modules/client/client.model"))
        .default;
      const client = await new ClientModel({ name: "Delete Me", orgId }).save();
      clientId = client.id.toString();
    });

    it("should allow OWNER to delete a client", async () => {
      const res = await request(app)
        .delete(`/api/v1/clients/${clientId}`)
        .set("Cookie", [ownerToken]);

      expect(res.status).toBe(200);
    });

    it("should deny MEMBER from deleting a client", async () => {
      const res = await request(app)
        .delete(`/api/v1/clients/${clientId}`)
        .set("Cookie", [memberToken]);

      expect(res.status).toBe(403);
    });
  });
});
