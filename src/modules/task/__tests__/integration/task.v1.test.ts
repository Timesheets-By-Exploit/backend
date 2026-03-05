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

describe("Task Module Integration Tests", () => {
  let accessToken: string;
  let orgId: string;
  let projectId: string;

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

    // Seed Client and Project for task testing
    const ClientModel = (await import("../../../client/client.model")).default;
    const ProjectModel = (await import("../../../project/project.model"))
      .default;

    const client = await new ClientModel({ name: "Test Client", orgId }).save();
    const project = await new ProjectModel({
      name: "Web App",
      orgId,
      clientId: client._id,
    }).save();
    projectId = project.id.toString();
  });

  describe("POST /api/v1/tasks", () => {
    it("should create a new task", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .set("Cookie", [accessToken])
        .send({
          name: "Design Layout",
          projectId: projectId,
          orgId: orgId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Design Layout");
      expect(res.body.data.projectId).toBe(projectId);
    });
  });

  describe("GET /api/v1/tasks", () => {
    it("should get all tasks for organization", async () => {
      const TaskModel = (await import("@modules/task/task.model")).default;
      await new TaskModel({ name: "Task 1", projectId, orgId }).save();

      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("PATCH /api/v1/tasks/:id", () => {
    it("should update task info", async () => {
      const TaskModel = (await import("@modules/task/task.model")).default;
      const task = await new TaskModel({
        name: "Old Task",
        projectId,
        orgId,
      }).save();

      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set("Cookie", [accessToken])
        .send({ name: "New Task", status: "DONE" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Task");
      expect(res.body.data.status).toBe("DONE");
    });

    it("should update task status to IN_PROGRESS", async () => {
      const TaskModel = (await import("@modules/task/task.model")).default;
      const task = await new TaskModel({
        name: "Work Task",
        projectId,
        orgId,
      }).save();

      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set("Cookie", [accessToken])
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("IN_PROGRESS");
    });
  });

  describe("DELETE /api/v1/tasks/:id", () => {
    it("should delete a task", async () => {
      const TaskModel = (await import("@modules/task/task.model")).default;
      const task = await new TaskModel({
        name: "To Delete",
        projectId,
        orgId,
      }).save();

      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set("Cookie", [accessToken]);

      expect(res.status).toBe(200);
      const deletedTask = await TaskModel.findById(task._id);
      expect(deletedTask).toBeNull();
    });
  });
});
