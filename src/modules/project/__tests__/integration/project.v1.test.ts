import request from "supertest";
import app from "@app";
import { clearDB } from "@tests/utils";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "../../../auth/__tests__/helpers/testHelpers";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";

const { verifiedUserEmail } = TEST_CONSTANTS;

describe("Project Module Integration Tests", () => {
  let accessToken: string;
  let orgId: string;
  let clientId: string;

  beforeEach(async () => {
    await clearDB();
    const { user, organization } = await seedOneUserWithOrg({
      email: verifiedUserEmail,
      isEmailVerified: true,
    });
    orgId = organization._id.toString();
    accessToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: user._id.toString(), email: user.email }),
    );

    // Seed a client for project testing
    const ClientModel = (await import("../../../client/client.model")).default;
    const client = await new ClientModel({ name: "Test Client", orgId }).save();
    clientId = client.id.toString();
  });

  describe("POST /api/v1/projects", () => {
    it("should create a new project", async () => {
      const res = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [accessToken])
        .send({
          name: "Website Redesign",
          clientId: clientId,
          isBillable: true,
          orgId: orgId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Website Redesign");
      expect(res.body.data.clientId).toBe(clientId);
    });
  });

  describe("GET /api/v1/projects", () => {
    it("should get all projects for organization", async () => {
      const ProjectModel = (await import("@modules/project/project.model"))
        .default;
      await new ProjectModel({ name: "Project A", orgId, clientId }).save();

      const res = await request(app)
        .get("/api/v1/projects")
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("PATCH /api/v1/projects/:id", () => {
    it("should update project info", async () => {
      const ProjectModel = (await import("@modules/project/project.model"))
        .default;
      const project = await new ProjectModel({
        name: "Old Project",
        orgId,
        clientId,
      }).save();

      const res = await request(app)
        .patch(`/api/v1/projects/${project._id}`)
        .set("Cookie", [accessToken])
        .send({ name: "New Project" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Project");
    });
  });

  describe("DELETE /api/v1/projects/:id", () => {
    it("should delete a project", async () => {
      const ProjectModel = (await import("@modules/project/project.model"))
        .default;
      const project = await new ProjectModel({
        name: "To Delete",
        orgId,
        clientId,
      }).save();

      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(200);
      const deletedProject = await ProjectModel.findById(project._id);
      expect(deletedProject).toBeNull();
    });
  });
});
