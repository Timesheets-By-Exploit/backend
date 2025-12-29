import request from "supertest";
import app from "@app";
import { clearDB } from "@tests/utils";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";
import UserService from "@modules/user/user.service";
import OrganizationService from "@modules/organization/organization.service";
import MembershipService from "@modules/membership/membership.service";
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

describe("GET /api/v1/org/members", () => {
  describe("Authentication", () => {
    it("should return 401 if access token cookie is missing", async () => {
      const res = await request(app).get("/api/v1/org/members");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 401 if access token is invalid", async () => {
      const res = await request(app)
        .get("/api/v1/org/members")
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

      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("Authorization", () => {
    let owner: IUser;
    let admin: IUser;
    let member: IUser;
    let viewer: IUser;
    let organizationId: string;

    beforeEach(async () => {
      const ownerData = UserFactory.generate({
        email: "owner@example.com",
        password: testPassword,
      });
      owner = await UserService.createUser({
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        password: ownerData.password,
      });
      owner.isEmailVerified = true;
      await owner.save();

      const createOrgResult = await OrganizationService.createOrganization(
        owner,
        {
          name: "Test Organization",
          size: 10,
        },
      );

      if (!createOrgResult.success) {
        throw new Error("Failed to create organization");
      }

      organizationId = (
        createOrgResult as { success: true; data: { organizationId: string } }
      ).data.organizationId;

      const adminData = UserFactory.generate({
        email: "admin@example.com",
        password: testPassword,
      });
      admin = await UserService.createUser({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        password: adminData.password,
      });
      admin.isEmailVerified = true;
      await admin.save();

      await MembershipService.createMembership({
        orgId: organizationId,
        userId: admin._id.toString(),
        role: "ADMIN",
        status: "ACTIVE",
      });
      const memberData = UserFactory.generate({
        email: "member@example.com",
        password: testPassword,
      });
      member = await UserService.createUser({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        password: memberData.password,
      });
      member.isEmailVerified = true;
      await member.save();

      await MembershipService.createMembership({
        orgId: organizationId,
        userId: member._id.toString(),
        role: "MEMBER",
        status: "ACTIVE",
      });

      const viewerData = UserFactory.generate({
        email: "viewer@example.com",
        password: testPassword,
      });
      viewer = await UserService.createUser({
        firstName: viewerData.firstName,
        lastName: viewerData.lastName,
        email: viewerData.email,
        password: viewerData.password,
      });
      viewer.isEmailVerified = true;
      await viewer.save();

      await MembershipService.createMembership({
        orgId: organizationId,
        userId: viewer._id.toString(),
        role: "VIEWER",
        status: "ACTIVE",
      });
    });

    it("should return 403 if user is MEMBER", async () => {
      const accessToken = generateAccessToken({
        id: member._id.toString(),
        email: member.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Access denied");
    });

    it("should return 403 if user is VIEWER", async () => {
      const accessToken = generateAccessToken({
        id: viewer._id.toString(),
        email: viewer.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Access denied");
    });

    it("should return 200 if user is OWNER", async () => {
      const accessToken = generateAccessToken({
        id: owner._id.toString(),
        email: owner.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 200 if user is ADMIN", async () => {
      const accessToken = generateAccessToken({
        id: admin._id.toString(),
        email: admin.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
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
      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User does not have an organization");
    });
  });

  describe("Successful Member Retrieval", () => {
    let owner: IUser;
    let admin: IUser;
    let member: IUser;
    let organizationId: string;
    let cookie: string;

    beforeEach(async () => {
      const ownerData = UserFactory.generate({
        email: "owner@example.com",
        password: testPassword,
      });
      owner = await UserService.createUser({
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        password: ownerData.password,
      });
      owner.isEmailVerified = true;
      await owner.save();

      const createOrgResult = await OrganizationService.createOrganization(
        owner,
        {
          name: "Test Organization",
          size: 10,
        },
      );

      if (!createOrgResult.success) {
        throw new Error("Failed to create organization");
      }

      organizationId = (
        createOrgResult as { success: true; data: { organizationId: string } }
      ).data.organizationId;

      const adminData = UserFactory.generate({
        email: "admin@example.com",
        password: testPassword,
      });
      admin = await UserService.createUser({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        password: adminData.password,
      });
      admin.isEmailVerified = true;
      await admin.save();

      await MembershipService.createMembership({
        orgId: organizationId,
        userId: admin._id.toString(),
        role: "ADMIN",
        status: "ACTIVE",
      });

      const memberData = UserFactory.generate({
        email: "member@example.com",
        password: testPassword,
      });
      member = await UserService.createUser({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        password: memberData.password,
      });
      member.isEmailVerified = true;
      await member.save();

      await MembershipService.createMembership({
        orgId: organizationId,
        userId: member._id.toString(),
        role: "MEMBER",
        status: "ACTIVE",
      });

      const accessToken = generateAccessToken({
        id: owner._id.toString(),
        email: owner.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 200 and list of members", async () => {
      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        "Organization members retrieved successfully",
      );
      expect(res.body.data).toHaveProperty("members");
      expect(Array.isArray(res.body.data.members)).toBe(true);
    });

    it("should return all members of the organization", async () => {
      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.members).toHaveLength(3);

      const memberEmails = res.body.data.members.map(
        (m: { email: string }) => m.email,
      );
      expect(memberEmails).toContain(owner.email);
      expect(memberEmails).toContain(admin.email);
      expect(memberEmails).toContain(member.email);
    });

    it("should return correct member data structure", async () => {
      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(200);

      const firstMember = res.body.data.members[0];
      expect(firstMember).toHaveProperty("membershipId");
      expect(firstMember).toHaveProperty("userId");
      expect(firstMember).toHaveProperty("firstName");
      expect(firstMember).toHaveProperty("lastName");
      expect(firstMember).toHaveProperty("email");
      expect(firstMember).toHaveProperty("role");
      expect(firstMember).toHaveProperty("status");
      expect(firstMember).toHaveProperty("joinedAt");
    });

    it("should return members sorted by creation date", async () => {
      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(200);

      const members = res.body.data.members;
      expect(members.length).toBeGreaterThan(1);

      for (let i = 1; i < members.length; i++) {
        const prevDate = new Date(members[i - 1].joinedAt).getTime();
        const currDate = new Date(members[i].joinedAt).getTime();
        expect(currDate).toBeGreaterThanOrEqual(prevDate);
      }
    });

    it("should include correct roles for each member", async () => {
      const res = await request(app)
        .get("/api/v1/org/members")
        .set("Cookie", [cookie]);

      expect(res.status).toBe(200);

      const members = res.body.data.members;
      const ownerMember = members.find(
        (m: { email: string }) => m.email === owner.email,
      );
      const adminMember = members.find(
        (m: { email: string }) => m.email === admin.email,
      );
      const memberMember = members.find(
        (m: { email: string }) => m.email === member.email,
      );

      expect(ownerMember.role).toBe("OWNER");
      expect(adminMember.role).toBe("ADMIN");
      expect(memberMember.role).toBe("MEMBER");
    });
  });
});
