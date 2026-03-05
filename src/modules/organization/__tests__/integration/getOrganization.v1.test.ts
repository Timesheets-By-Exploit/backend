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

const { verifiedUserEmail, testPassword } = TEST_CONSTANTS;

beforeEach(async () => {
  await clearDB();
});

describe("GET /api/v1/org", () => {
  describe("Authentication", () => {
    it("should return 401 if access token cookie is missing", async () => {
      const res = await request(app).get("/api/v1/org");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 401 if access token is invalid", async () => {
      const res = await request(app)
        .get("/api/v1/org")
        .set("Cookie", ["access_token=invalid_token"]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 if user in token does not exist", async () => {
      const nonExistentUserId = "507f1f77bcf86cd799439011";
      const accessToken = generateAccessToken({
        id: nonExistentUserId,
        email: "nonexistent@example.com",
      });

      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app).get("/api/v1/org").set("Cookie", [cookie]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("User Has No Organization", () => {
    let user: IUser;
    let cookie: string;

    beforeEach(async () => {
      const userData = UserFactory.generate({
        email: verifiedUserEmail,
        password: testPassword,
      });
      user = await UserService.createUser({
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
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 404 if user does not have an organization", async () => {
      const res = await request(app).get("/api/v1/org").set("Cookie", [cookie]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User does not have an organization");
    });
  });

  describe("Successful Organization Retrieval", () => {
    let user: IUser;
    let organizationId: string;
    let cookie: string;

    beforeEach(async () => {
      const userData = UserFactory.generate({
        email: verifiedUserEmail,
        password: testPassword,
      });
      user = await UserService.createUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      });
      user.isEmailVerified = true;
      await user.save();

      const createOrgResult = await OrganizationService.createOrganization(
        user,
        {
          name: "Test Organization",
          size: 10,
          domain: "example.com",
          description: "Test description",
        },
      );

      if (!createOrgResult.success) {
        throw new Error("Failed to create organization");
      }

      organizationId = (
        createOrgResult as { success: true; data: { organizationId: string } }
      ).data.organizationId;

      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 200 and organization with user role", async () => {
      const res = await request(app).get("/api/v1/org").set("Cookie", [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Organization retrieved successfully");
      expect(res.body.data).toHaveProperty("organization");
      expect(res.body.data).toHaveProperty("role");
    });

    it("should return correct organization data structure", async () => {
      const res = await request(app).get("/api/v1/org").set("Cookie", [cookie]);

      expect(res.status).toBe(200);

      const { organization } = res.body.data;

      expect(organization.id).toBe(organizationId);
      expect(organization.name).toBe("Test Organization");
      expect(organization.slug).toBeDefined();
      expect(organization.domain).toBe("example.com");
      expect(organization.description).toBe("Test description");
      expect(organization.status).toBe("ACTIVE");
      expect(organization.size).toBe(10);
      expect(organization.settings.timezone).toBe("UTC");
      expect(organization.settings.workHours).toBe(8);
      expect(organization.createdAt).toBeDefined();
      expect(organization.updatedAt).toBeDefined();
    });

    it("should return OWNER role for organization creator", async () => {
      const res = await request(app).get("/api/v1/org").set("Cookie", [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("OWNER");
    });
  });

  describe("Organization Without Optional Fields", () => {
    let user: IUser;
    let cookie: string;

    beforeEach(async () => {
      const userData = UserFactory.generate({
        email: verifiedUserEmail,
        password: testPassword,
      });
      user = await UserService.createUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      });
      user.isEmailVerified = true;
      await user.save();

      const createOrgResult = await OrganizationService.createOrganization(
        user,
        {
          name: "Minimal Organization",
          size: 5,
        },
      );

      if (!createOrgResult.success) {
        throw new Error("Failed to create organization");
      }

      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should handle organization without optional fields", async () => {
      const res = await request(app).get("/api/v1/org").set("Cookie", [cookie]);

      expect(res.status).toBe(200);
      const { organization: orgData } = res.body.data;
      expect(orgData.name).toBe("Minimal Organization");
      expect(orgData.domain).toBeUndefined();
      expect(orgData.description).toBeUndefined();
    });
  });
});
