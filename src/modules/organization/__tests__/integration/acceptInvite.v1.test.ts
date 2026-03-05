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
import { hashWithCrypto } from "@utils/encryptors";
import { CreateOrganizationOutput } from "@modules/organization/organization.types";
import { ISuccessPayload } from "src/types";

const { testPassword } = TEST_CONSTANTS;

beforeEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

describe("POST /api/v1/org/invite/accept", () => {
  let owner: IUser;
  let organizationId: string;
  let invitee: IUser;
  let cookie: string;
  let rawToken: string;
  let inviteTokenHash: string;

  beforeEach(async () => {
    const ownerData = UserFactory.generate();
    owner = await UserService.createUser({
      ...ownerData,
      password: testPassword,
    });
    owner.isEmailVerified = true;
    await owner.save();

    const orgResult = await OrganizationService.createOrganization(owner, {
      name: "Test Org",
      size: 10,
    });
    if (!orgResult.success) throw new Error("Failed to create org");
    organizationId = (orgResult as ISuccessPayload<CreateOrganizationOutput>)
      .data.organizationId;

    const inviteeData = UserFactory.generate();
    invitee = await UserService.createUser({
      ...inviteeData,
      password: testPassword,
    });
    invitee.isEmailVerified = true;
    await invitee.save();

    const accessToken = generateAccessToken({
      id: invitee._id.toString(),
      email: invitee.email,
    });
    cookie = createSignedAccessTokenCookie(accessToken);

    rawToken = "valid-token-123";
    inviteTokenHash = hashWithCrypto(rawToken);

    await MembershipService.createMembership({
      orgId: organizationId,
      email: invitee.email,
      role: "MEMBER",
      status: "PENDING",
      inviteTokenHash: inviteTokenHash,
      inviteExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      invitedBy: owner._id.toString(),
    });
  });

  it("should successfully accept an invitation", async () => {
    const res = await request(app)
      .post("/api/v1/org/invite/accept")
      .set("Cookie", [cookie])
      .send({ token: rawToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("membershipId");
    expect(res.body.data.orgId.toString()).toBe(organizationId);

    const membership = await MembershipService.getMembershipByUserAndOrg(
      invitee._id.toString(),
      organizationId,
      { select: "+inviteTokenHash" },
    );

    expect(membership).toBeDefined();
    expect(membership?.status).toBe("ACTIVE");
    expect(membership?.userId?.toString()).toBe(invitee._id.toString());
    expect(membership?.inviteTokenHash).toBeNull();
    expect(membership?.inviteExpiresAt).toBeNull();
    expect(membership?.acceptedAt).toBeDefined();
    expect(membership?.joinedAt).toBeDefined();
  });

  it("should return 404 if token is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/org/invite/accept")
      .set("Cookie", [cookie])
      .send({ token: "invalid-token" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Invite not found");
  });

  it("should return 410 if invite is expired", async () => {
    const existing = await MembershipService.getMembershipByEmailAndOrg(
      invitee.email,
      organizationId,
    );
    if (existing) {
      existing.inviteExpiresAt = new Date(Date.now() - 10000);
      await existing.save();
    }

    const res = await request(app)
      .post("/api/v1/org/invite/accept")
      .set("Cookie", [cookie])
      .send({ token: rawToken });

    expect(res.status).toBe(410);
    expect(res.body.error).toBe("Invite expired");
  });

  it("should return 403 if email validation fails (mismatch)", async () => {
    const otherUser = await UserService.createUser({
      ...UserFactory.generate(),
      password: testPassword,
    });
    const otherToken = generateAccessToken({
      id: otherUser._id.toString(),
      email: otherUser.email,
    });
    const otherCookie = createSignedAccessTokenCookie(otherToken);

    const res = await request(app)
      .post("/api/v1/org/invite/accept")
      .set("Cookie", [otherCookie])
      .send({ token: rawToken });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Invite email mismatch");
  });

  it("should return 409 if user already has an active organization membership", async () => {
    const newOwner = await UserService.createUser({
      ...UserFactory.generate(),
      password: testPassword,
    });
    newOwner.isEmailVerified = true;
    await newOwner.save();

    const otherOrgResult = await OrganizationService.createOrganization(
      newOwner,
      {
        name: "Other Org",
        size: 5,
      },
    );
    const otherOrgId = (
      otherOrgResult as ISuccessPayload<CreateOrganizationOutput>
    ).data.organizationId;

    await MembershipService.createMembership({
      orgId: otherOrgId,
      userId: invitee._id.toString(),
      role: "MEMBER",
      status: "ACTIVE",
    });

    const res = await request(app)
      .post("/api/v1/org/invite/accept")
      .set("Cookie", [cookie])
      .send({ token: rawToken });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("User already belongs to an organization");
  });
});
