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
import { sendEmailWithTemplate } from "@services/email.service";

jest.mock("@services/email.service");

const { verifiedUserEmail, testPassword } = TEST_CONSTANTS;

beforeEach(async () => {
  await clearDB();
  jest.clearAllMocks();
  (sendEmailWithTemplate as jest.Mock).mockResolvedValue({
    success: true,
    emailSent: true,
  });
});

describe("POST /api/v1/org/invite", () => {
  describe("Authentication", () => {
    it("should return 401 if access token cookie is missing", async () => {
      const res = await request(app).post("/api/v1/org/invite").send({
        email: "invitee@example.com",
        role: "MEMBER",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 401 if access token is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", ["access_token=invalid_token"])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
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
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

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
        role: "MANAGER",
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
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

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
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Access denied");
    });

    it("should allow OWNER to invite", async () => {
      const inviteeData = UserFactory.generate({
        email: "invitee@example.com",
        password: testPassword,
      });
      const invitee = await UserService.createUser({
        firstName: inviteeData.firstName,
        lastName: inviteeData.lastName,
        email: inviteeData.email,
        password: inviteeData.password,
      });
      invitee.isEmailVerified = true;
      await invitee.save();

      const accessToken = generateAccessToken({
        id: owner._id.toString(),
        email: owner.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should allow MANAGER to invite", async () => {
      const inviteeData = UserFactory.generate({
        email: "invitee@example.com",
        password: testPassword,
      });
      const invitee = await UserService.createUser({
        firstName: inviteeData.firstName,
        lastName: inviteeData.lastName,
        email: inviteeData.email,
        password: inviteeData.password,
      });
      invitee.isEmailVerified = true;
      await invitee.save();

      const accessToken = generateAccessToken({
        id: admin._id.toString(),
        email: admin.email,
      });
      const cookie = createSignedAccessTokenCookie(accessToken);

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Validation", () => {
    let owner: IUser;
    let cookie: string;

    beforeEach(async () => {
      const ownerData = UserFactory.generate({
        email: verifiedUserEmail,
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

      await OrganizationService.createOrganization(owner, {
        name: "Test Organization",
        size: 10,
      });

      const accessToken = generateAccessToken({
        id: owner._id.toString(),
        email: owner.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 400 if email is missing", async () => {
      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          role: "MEMBER",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if email is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invalid-email",
          role: "MEMBER",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if role is missing", async () => {
      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if role is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "INVALID_ROLE",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
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
      const inviteeData = UserFactory.generate({
        email: "invitee@example.com",
        password: testPassword,
      });
      const invitee = await UserService.createUser({
        firstName: inviteeData.firstName,
        lastName: inviteeData.lastName,
        email: inviteeData.email,
        password: inviteeData.password,
      });
      invitee.isEmailVerified = true;
      await invitee.save();

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("User does not have an organization");
    });
  });

  describe("Business Logic", () => {
    let owner: IUser;
    let cookie: string;
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

      const accessToken = generateAccessToken({
        id: owner._id.toString(),
        email: owner.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 400 if user is already an active member", async () => {
      const existingUserData = UserFactory.generate({
        email: "existing@example.com",
        password: testPassword,
      });
      const existingUser = await UserService.createUser({
        firstName: existingUserData.firstName,
        lastName: existingUserData.lastName,
        email: existingUserData.email,
        password: existingUserData.password,
      });
      existingUser.isEmailVerified = true;
      await existingUser.save();

      await MembershipService.createMembership({
        orgId: organizationId,
        userId: existingUser._id.toString(),
        role: "MEMBER",
        status: "ACTIVE",
      });

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "existing@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(
        "User is already a member of this organization",
      );
    });

    it("should return 400 if pending invitation already exists", async () => {
      const inviteeData = UserFactory.generate({
        email: "invitee@example.com",
        password: testPassword,
      });
      const invitee = await UserService.createUser({
        firstName: inviteeData.firstName,
        lastName: inviteeData.lastName,
        email: inviteeData.email,
        password: inviteeData.password,
      });
      invitee.isEmailVerified = true;
      await invitee.save();

      const res1 = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.error).toBe(
        "An invitation has already been sent to this email",
      );
    });

    it("should allow inviting non-existent users", async () => {
      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "nonexistent@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const membership = await MembershipService.getMembershipByEmailAndOrg(
        "nonexistent@example.com",
        organizationId,
      );

      expect(membership).toBeDefined();
      expect(membership?.email).toBe("nonexistent@example.com");
      expect(membership?.userId).toBeUndefined();
      expect(membership?.status).toBe("PENDING");
    });
  });

  describe("Successful Invitation", () => {
    let owner: IUser;
    let cookie: string;
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

      const accessToken = generateAccessToken({
        id: owner._id.toString(),
        email: owner.email,
      });
      cookie = createSignedAccessTokenCookie(accessToken);
    });

    it("should return 201 and create pending membership", async () => {
      const inviteeData = UserFactory.generate({
        email: "invitee@example.com",
        password: testPassword,
      });
      const invitee = await UserService.createUser({
        firstName: inviteeData.firstName,
        lastName: inviteeData.lastName,
        email: inviteeData.email,
        password: inviteeData.password,
      });
      invitee.isEmailVerified = true;
      await invitee.save();

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Invitation sent successfully");
      expect(res.body.data).toHaveProperty("invitationId");
      expect(res.body.data).toHaveProperty("emailSent");
      expect(res.body.data.emailSent).toBe(true);
    });

    it("should create pending membership in database", async () => {
      const inviteeData = UserFactory.generate({
        email: "invitee@example.com",
        password: testPassword,
      });
      const invitee = await UserService.createUser({
        firstName: inviteeData.firstName,
        lastName: inviteeData.lastName,
        email: inviteeData.email,
        password: inviteeData.password,
      });
      invitee.isEmailVerified = true;
      await invitee.save();

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MANAGER",
        });

      expect(res.status).toBe(201);

      const membership = await MembershipService.getMembershipByUserAndOrg(
        invitee._id.toString(),
        organizationId,
      );

      expect(membership).toBeDefined();
      expect(membership?.role).toBe("MANAGER");
      expect(membership?.status).toBe("PENDING");
      expect(membership?.invitedBy?.toString()).toBe(owner._id.toString());
      expect(membership?.invitationToken).toBeDefined();
    });

    it("should send email with correct merge info", async () => {
      const inviteeData = UserFactory.generate({
        email: "invitee@example.com",
        password: testPassword,
      });
      const invitee = await UserService.createUser({
        firstName: inviteeData.firstName,
        lastName: inviteeData.lastName,
        email: inviteeData.email,
        password: inviteeData.password,
      });
      invitee.isEmailVerified = true;
      await invitee.save();

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "invitee@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(sendEmailWithTemplate).toHaveBeenCalledTimes(1);

      const call = (sendEmailWithTemplate as jest.Mock).mock.calls[0][0];
      expect(call.to[0].email_address.address).toBe("invitee@example.com");
      expect(call.merge_info.role).toBe("MEMBER");
      expect(call.merge_info.organizationName).toBe("Test Organization");
      expect(call.merge_info.name).toBe("invitee");
      expect(call.merge_info.acceptLink).toContain("/accept-invitation?token=");
      expect(call.merge_info.verify_account_link).toBeDefined();
      expect(call.merge_info.invitationLinkExpiry).toBe("7 days");
      expect(call.merge_info.ownersName).toBeDefined();
    });

    it("should work for different roles", async () => {
      const roles = ["OWNER", "MANAGER", "MEMBER", "VIEWER"] as const;

      for (const role of roles) {
        const inviteeData = UserFactory.generate({
          email: `invitee-${role.toLowerCase()}@example.com`,
          password: testPassword,
        });
        const invitee = await UserService.createUser({
          firstName: inviteeData.firstName,
          lastName: inviteeData.lastName,
          email: inviteeData.email,
          password: inviteeData.password,
        });
        invitee.isEmailVerified = true;
        await invitee.save();

        const res = await request(app)
          .post("/api/v1/org/invite")
          .set("Cookie", [cookie])
          .send({
            email: `invitee-${role.toLowerCase()}@example.com`,
            role,
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      }
    });

    it("should create pending membership for existing users who are not members", async () => {
      const existingUserData = UserFactory.generate({
        email: "existing@example.com",
        password: testPassword,
      });
      const existingUser = await UserService.createUser({
        firstName: existingUserData.firstName,
        lastName: existingUserData.lastName,
        email: existingUserData.email,
        password: existingUserData.password,
      });
      existingUser.isEmailVerified = true;
      await existingUser.save();

      const res = await request(app)
        .post("/api/v1/org/invite")
        .set("Cookie", [cookie])
        .send({
          email: "existing@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const membership = await MembershipService.getMembershipByUserAndOrg(
        existingUser._id.toString(),
        organizationId,
      );
      expect(membership).toBeDefined();
      expect(membership?.status).toBe("PENDING");
      expect(membership?.invitationToken).toBeDefined();
      expect(membership?.invitedBy?.toString()).toBe(owner._id.toString());
    });
  });
});
