import request from "supertest";
import app from "@app";
import { clearDB } from "@tests/utils";
import { seedOneUserWithOrg } from "@tests/helpers/seed";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "../../../auth/__tests__/helpers/testHelpers";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";
import TimeEntryModel from "../../time-entry.model";
import UserModel from "@modules/user/user.model";

const { verifiedUserEmail } = TEST_CONSTANTS;

jest.setTimeout(30000);

describe("Time Entry Module Integration Tests", () => {
  let accessToken: string;
  let userId: string;
  let orgId: string;
  let projectId: string;
  let taskId: string;

  beforeEach(async () => {
    await clearDB();
    const { user, organization } = await seedOneUserWithOrg({
      email: verifiedUserEmail,
      isEmailVerified: true,
    });
    userId = user._id.toString();
    orgId = organization._id.toString();
    accessToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: userId, email: user.email }),
    );

    // Seed Client, Project and Task
    const ClientModel = (await import("../../../client/client.model")).default;
    const ProjectModel = (await import("../../../project/project.model"))
      .default;
    const TaskModel = (await import("../../../task/task.model")).default;

    const client = await new ClientModel({ name: "Client X", orgId }).save();
    const clientId = client.id.toString();

    const project = await new ProjectModel({
      name: "Project A",
      orgId,
      clientId,
    }).save();
    projectId = project.id.toString();

    const task = await new TaskModel({
      name: "Task 1",
      projectId,
      orgId,
    }).save();
    taskId = task.id.toString();
  });

  describe("POST /api/v1/time-entries/start", () => {
    it("should start a new timer", async () => {
      const res = await request(app)
        .post("/api/v1/time-entries/start")
        .set("Cookie", [accessToken])
        .send({
          description: "Coding Phase 3",
          projectId,
          taskId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe("Coding Phase 3");
      expect(res.body.data.endTime).toBeNull();
      expect(res.body.data.isManual).toBe(false);
      expect(res.body.data.projectId).toBe(projectId);
      expect(res.body.data.taskId).toBe(taskId);

      const user = await UserModel.findById(userId);
      expect(user?.activeTimerId?.toString()).toBe(res.body.data.id);
    });

    it("should auto-stop the previous timer when starting a new one", async () => {
      // Start first timer
      const res1 = await request(app)
        .post("/api/v1/time-entries/start")
        .set("Cookie", [accessToken])
        .send({ description: "First Task", projectId, taskId });

      const firstId = res1.body.data.id;

      // Start second timer
      const res2 = await request(app)
        .post("/api/v1/time-entries/start")
        .set("Cookie", [accessToken])
        .send({ description: "Second Task", projectId, taskId });

      expect(res2.status).toBe(201);

      const stoppedFirstEntry = await TimeEntryModel.findById(firstId);
      expect(stoppedFirstEntry?.endTime).not.toBeNull();

      const user = await UserModel.findById(userId);
      expect(user?.activeTimerId?.toString()).toBe(res2.body.data.id as string);
    });
  });

  describe("POST /api/v1/time-entries/stop", () => {
    it("should stop the active timer", async () => {
      await request(app)
        .post("/api/v1/time-entries/start")
        .set("Cookie", [accessToken])
        .send({ description: "To be stopped", projectId, taskId });

      const res = await request(app)
        .post("/api/v1/time-entries/stop")
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(200);
      expect(res.body.data.endTime).not.toBeNull();
      expect(res.body.data.duration).toBeGreaterThanOrEqual(0);

      const user = await UserModel.findById(userId);
      expect(user?.activeTimerId).toBeNull();
    });

    it("should return 404 if no active timer exists", async () => {
      const res = await request(app)
        .post("/api/v1/time-entries/stop")
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/time-entries/manual", () => {
    it("should create a manual entry", async () => {
      const startTime = new Date(Date.now() - 3600000).toISOString();
      const endTime = new Date().toISOString();

      const res = await request(app)
        .post("/api/v1/time-entries/manual")
        .set("Cookie", [accessToken])
        .send({
          description: "Manual Entry",
          startTime,
          endTime,
          projectId,
          taskId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.duration).toBeGreaterThan(0);
      expect(res.body.data.description).toBe("Manual Entry");
      expect(res.body.data.isManual).toBe(true);
      expect(res.body.data.projectId).toBe(projectId);
    });
  });

  describe("GET /api/v1/time-entries/active", () => {
    it("should get the active timer", async () => {
      await request(app)
        .post("/api/v1/time-entries/start")
        .set("Cookie", [accessToken])
        .send({ description: "Active", projectId, taskId });

      const res = await request(app)
        .get("/api/v1/time-entries/active")
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(200);
      expect(res.body.data).not.toBeNull();
      expect(res.body.data.description).toBe("Active");
    });
  });

  describe("GET /api/v1/time-entries", () => {
    it("should list time entries", async () => {
      await new TimeEntryModel({
        userId,
        orgId,
        projectId,
        taskId,
        startTime: new Date(),
        description: "Entry 1",
      }).save();

      const res = await request(app)
        .get("/api/v1/time-entries")
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].description).toBe("Entry 1");
    });
  });
});
