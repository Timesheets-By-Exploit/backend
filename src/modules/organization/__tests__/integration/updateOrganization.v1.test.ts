import request from "supertest";
import app from "@app";
import { clearDB } from "@tests/utils";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";
import UserService from "@modules/user/user.service";
import OrganizationService from "@modules/organization/organization.service";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "@modules/auth/__tests__/helpers/testHelpers";
import { UserFactory } from "@tests/factories/user.factory";
import { IUser } from "@modules/user/user.types";
import { seedOneUserWithOrg, seedUserInOrg } from "@tests/helpers/seed";

const { verifiedUserEmail, testPassword } = TEST_CONSTANTS;

beforeEach(async () => {
  await clearDB();
});

describe("PUT /api/v1/org", () => {
  describe("Authentication", () => {
    it("should return 401 if access token cookie is missing", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .send({ name: "Updated Org" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 401 if access token is invalid", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", ["access_token=invalid_token"])
        .send({ name: "Updated Org" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 if user in token does not exist", async () => {
      const accessToken = generateAccessToken({
        id: "507f1f77bcf86cd799439011",
        email: "nonexistent@example.com",
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "Updated Org" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("Authorization", () => {
    it("should return 404 if user has no organization", async () => {
      const userData = UserFactory.generate({
        email: verifiedUserEmail,
        password: testPassword,
      });
      const user = await UserService.createUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      });
      user.isEmailVerified = true;
      await user.save();

      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "Updated Org" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 403 for a MEMBER role", async () => {
      const { organization } = await seedOneUserWithOrg();
      const { user: member } = await seedUserInOrg(
        organization._id.toString(),
        {},
        "MEMBER",
      );

      const accessToken = generateAccessToken({
        id: member._id.toString(),
        email: member.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "Updated Org" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should return 403 for a VIEWER role", async () => {
      const { organization } = await seedOneUserWithOrg();
      const { user: viewer } = await seedUserInOrg(
        organization._id.toString(),
        {},
        "VIEWER",
      );

      const accessToken = generateAccessToken({
        id: viewer._id.toString(),
        email: viewer.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "Updated Org" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Validation", () => {
    let cookie: string;

    beforeEach(async () => {
      const { user } = await seedOneUserWithOrg({ email: verifiedUserEmail });
      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 400 if name is too short", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "A" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(
        JSON.stringify(res.body)
          .toLowerCase()
          .includes("at least 2 characters"),
      ).toBe(true);
    });

    it("should return 400 if name is too long", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "A".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(
        JSON.stringify(res.body)
          .toLowerCase()
          .includes("must not exceed 100 characters"),
      ).toBe(true);
    });

    it("should return 400 if size is less than 1", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ size: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(
        JSON.stringify(res.body).toLowerCase().includes("at least 1"),
      ).toBe(true);
    });

    it("should return 400 if size is not an integer", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ size: 5.5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if status is invalid", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ status: "UNKNOWN" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if description exceeds 500 characters", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ description: "A".repeat(501) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(
        JSON.stringify(res.body)
          .toLowerCase()
          .includes("must not exceed 500 characters"),
      ).toBe(true);
    });
  });

  describe("Successful Update — OWNER", () => {
    let user: IUser;
    let cookie: string;
    let orgId: string;

    beforeEach(async () => {
      const seeded = await seedOneUserWithOrg(
        { email: verifiedUserEmail },
        {
          name: "Original Org",
          size: 10,
          domain: "original.com",
          description: "Original description",
        },
        "OWNER",
      );
      user = seeded.user;
      orgId = seeded.organization._id.toString();

      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 200 with updated organization", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Updated Org Name",
          domain: "updated.com",
          description: "Updated description",
          status: "ACTIVE",
          size: 50,
          settings: { timezone: "America/New_York", workHours: 9 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Organization updated successfully");
      expect(res.body.data).toHaveProperty("organization");
    });

    it("should persist all fields to the database", async () => {
      await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Updated Org Name",
          domain: "updated.com",
          description: "Updated description",
          status: "INACTIVE",
          size: 50,
          settings: { timezone: "America/New_York", workHours: 9 },
        });

      const org = await OrganizationService.getOrganizationById(orgId);

      expect(org?.name).toBe("Updated Org Name");
      expect(org?.domain).toBe("updated.com");
      expect(org?.description).toBe("Updated description");
      expect(org?.status).toBe("INACTIVE");
      expect(org?.size).toBe(50);
      expect(org?.settings.timezone).toBe("America/New_York");
      expect(org?.settings.workHours).toBe(9);
    });

    it("should return the correct response structure", async () => {
      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "Updated Org Name", size: 20 });

      const { organization } = res.body.data;

      expect(organization).toHaveProperty("id");
      expect(organization).toHaveProperty("name", "Updated Org Name");
      expect(organization).toHaveProperty("slug");
      expect(organization).toHaveProperty("status");
      expect(organization).toHaveProperty("size", 20);
      expect(organization).toHaveProperty("settings");
      expect(organization).toHaveProperty("createdAt");
      expect(organization).toHaveProperty("updatedAt");
    });

    it("should apply a partial update without affecting unspecified fields", async () => {
      await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ size: 99 });

      const org = await OrganizationService.getOrganizationById(orgId);

      expect(org?.size).toBe(99);
      expect(org?.name).toBe("Original Org");
      expect(org?.domain).toBe("original.com");
    });
  });

  describe("Successful Update — MANAGER", () => {
    it("should allow a MANAGER to update the organization", async () => {
      const { organization } = await seedOneUserWithOrg();
      const { user: manager } = await seedUserInOrg(
        organization._id.toString(),
        {},
        "MANAGER",
      );

      const accessToken = generateAccessToken({
        id: manager._id.toString(),
        email: manager.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .put("/api/v1/org")
        .set("Cookie", [cookie])
        .send({ name: "Manager Updated Name", size: 25 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization.name).toBe("Manager Updated Name");
    });
  });
});
