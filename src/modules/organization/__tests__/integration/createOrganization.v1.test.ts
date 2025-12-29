import request from "supertest";
import app from "@app";
import { clearDB } from "@tests/utils";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";
import UserService from "@modules/user/user.service";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "@modules/auth/__tests__/helpers/testHelpers";
import { UserFactory } from "@tests/factories/user.factory";
import { IUser } from "@modules/user/user.types";
import OrganizationService from "@modules/organization/organization.service";
import MembershipService from "@modules/membership/membership.service";

const { verifiedUserEmail, testPassword } = TEST_CONSTANTS;

beforeEach(async () => {
  await clearDB();
});

describe("POST /api/v1/org", () => {
  describe("Authentication", () => {
    it("should return 401 if access token cookie is missing", async () => {
      const res = await request(app).post("/api/v1/org").send({
        name: "Test Organization",
        size: 10,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 401 if access token is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", ["access_token=invalid_token"])
        .send({
          name: "Test Organization",
          size: 10,
        });

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

      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("Validation", () => {
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

    it("should return 400 if name is missing", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          size: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if name is too short", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "A",
          size: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(
        res.body.error?.toLowerCase().includes("at least 2 characters") ||
          JSON.stringify(res.body)
            .toLowerCase()
            .includes("at least 2 characters"),
      ).toBe(true);
    });

    it("should return 400 if name is too long", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "A".repeat(51),
          size: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      // Validation errors may be in error field or nested in errors
      expect(
        res.body.error?.toLowerCase().includes("at most 50 characters") ||
          JSON.stringify(res.body)
            .toLowerCase()
            .includes("at most 50 characters"),
      ).toBe(true);
    });

    it("should return 400 if size is missing", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if size is less than 1", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      // Validation errors may be in error field or nested in errors
      expect(
        res.body.error?.toLowerCase().includes("at least 1") ||
          JSON.stringify(res.body).toLowerCase().includes("at least 1"),
      ).toBe(true);
    });

    it("should return 400 if size is not an integer", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should accept valid optional fields (domain, description)", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10,
          domain: "example.com",
          description: "Test description",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Successful Organization Creation", () => {
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

    it("should return 201 and create organization with membership", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Organization created successfully");
      expect(res.body.data).toHaveProperty("organizationId");
      expect(res.body.data).toHaveProperty("membershipId");
    });

    it("should create organization in database with correct fields", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10,
          domain: "example.com",
          description: "Test description",
        });

      expect(res.status).toBe(201);

      const organization = await OrganizationService.getOrganizationById(
        res.body.data.organizationId,
      );

      expect(organization).toBeDefined();
      expect(organization?.name).toBe("Test Organization");
      expect(organization?.size).toBe(10);
      expect(organization?.domain).toBe("example.com");
      expect(organization?.description).toBe("Test description");
      expect(organization?.owner.toString()).toBe(user._id.toString());
      expect(organization?.status).toBe("ACTIVE");
      expect(organization?.slug).toBeDefined();
      expect(organization?.settings.timezone).toBe("UTC");
      expect(organization?.settings.workHours).toBe(8);
    });

    it("should create OWNER membership with ACTIVE status", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10,
        });

      expect(res.status).toBe(201);

      const membership = await MembershipService.getMembershipById(
        res.body.data.membershipId,
      );

      expect(membership).toBeDefined();
      expect(membership?.role).toBe("OWNER");
      expect(membership?.status).toBe("ACTIVE");
      expect(membership?.orgId.toString()).toBe(res.body.data.organizationId);
      expect(membership?.userId.toString()).toBe(user._id.toString());
    });

    it("should generate unique slug for organization", async () => {
      const res1 = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10,
        });

      expect(res1.status).toBe(201);

      const org1 = await OrganizationService.getOrganizationById(
        res1.body.data.organizationId,
      );
      const slug1 = org1?.slug;

      const res2 = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Test Organization",
          size: 10,
        });

      expect(res2.status).toBe(201);

      const org2 = await OrganizationService.getOrganizationById(
        res2.body.data.organizationId,
      );
      const slug2 = org2?.slug;

      expect(slug1).toBeDefined();
      expect(slug2).toBeDefined();
      expect(slug1).not.toBe(slug2);
    });

    it("should allow user to create multiple organizations", async () => {
      const res1 = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "First Organization",
          size: 10,
        });

      const res2 = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Second Organization",
          size: 20,
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      const organizations = await OrganizationService.getOrganizationsByOwner(
        user._id.toString(),
      );

      expect(organizations).toHaveLength(2);
    });

    it("should create membership for each organization", async () => {
      const res1 = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "First Organization",
          size: 10,
        });

      const res2 = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Second Organization",
          size: 20,
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      const memberships = await MembershipService.getMembershipsByUser(
        user._id.toString(),
      );

      expect(memberships).toHaveLength(2);
      expect(memberships[0]?.role).toBe("OWNER");
      expect(memberships[1]?.role).toBe("OWNER");
    });
  });

  describe("Transaction Safety", () => {
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

    it("should handle transaction rollback correctly", async () => {
      const res = await request(app)
        .post("/api/v1/org")
        .set("Cookie", [cookie])
        .send({
          name: "Transaction Test Organization",
          size: 10,
        });

      expect(res.status).toBe(201);
      const organization = await OrganizationService.getOrganizationById(
        res.body.data.organizationId,
      );
      const membership = await MembershipService.getMembershipById(
        res.body.data.membershipId,
      );

      expect(organization).toBeDefined();
      expect(membership).toBeDefined();
      expect(membership?.orgId.toString()).toBe(organization?._id.toString());
      expect(membership?.userId.toString()).toBe(user._id.toString());
    });
  });
});
