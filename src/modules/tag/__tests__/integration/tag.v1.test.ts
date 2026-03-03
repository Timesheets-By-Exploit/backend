import request from "supertest";
import app from "@app";
import { clearDB } from "@tests/utils";
import { seedOneUserWithOrg, seedUserInOrg } from "@tests/helpers/seed";
import {
  TEST_CONSTANTS,
  createSignedAccessTokenCookie,
} from "../../../auth/__tests__/helpers/testHelpers";
import OrganizationService from "@modules/organization/organization.service";
import { generateAccessToken } from "@modules/auth/utils/auth.tokens";
import { ISuccessPayload } from "src/types";
import { GetOrganizationOutput } from "@modules/organization/organization.types";

const { verifiedUserEmail, testPassword } = TEST_CONSTANTS;

describe("POST /api/v1/tags", () => {
  let accessToken: string;
  let orgId: string;

  beforeEach(async () => {
    await clearDB();
    const { user } = await seedOneUserWithOrg({
      email: verifiedUserEmail,
      password: testPassword,
      isEmailVerified: true,
    });

    const orgResult = await OrganizationService.getUserOrganization(
      user._id.toString(),
    );
    if (!orgResult.success) throw new Error("Org not found");
    orgId = (
      orgResult as ISuccessPayload<GetOrganizationOutput>
    ).data.organization.id.toString();

    const token = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
    });
    accessToken = createSignedAccessTokenCookie(token);
  });

  it("should create a new tag", async () => {
    const res = await request(app)
      .post("/api/v1/tags")
      .set("Cookie", [accessToken])
      .send({
        name: "Billable",
        color: "#FF0000",
        orgId: orgId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Billable");
    expect(res.body.data.orgId).toBe(orgId);
  });

  it("should return 401 if not authenticated", async () => {
    const res = await request(app).post("/api/v1/tags").send({
      name: "Billable",
      orgId: orgId,
    });

    expect(res.status).toBe(401);
  });

  it("should return 403 if user is a MEMBER (only MANAGER/OWNER allowed)", async () => {
    const { user } = await seedUserInOrg(orgId, {}, "MEMBER");
    const memberToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: user._id.toString(), email: user.email }),
    );

    const res = await request(app)
      .post("/api/v1/tags")
      .set("Cookie", [memberToken])
      .send({
        name: "Member Tag",
        color: "#0000FF",
        orgId: orgId,
      });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/tags", () => {
  let accessToken: string;
  let orgId: string;

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

    // Create a tag directly via model for testing GET
    const TagModel = (await import("../../tag.model")).default;
    await new TagModel({ name: "Tag 1", orgId }).save();
    await new TagModel({ name: "Tag 2", orgId }).save();
  });

  it("should get all tags for the organization", async () => {
    const res = await request(app)
      .get("/api/v1/tags")
      .set("Cookie", [accessToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("should allow a VIEWER to get all tags", async () => {
    const { user } = await seedUserInOrg(orgId, {}, "VIEWER");
    const viewerToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: user._id.toString(), email: user.email }),
    );

    const res = await request(app)
      .get("/api/v1/tags")
      .set("Cookie", [viewerToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("PATCH /api/v1/tags/:id", () => {
  let accessToken: string;
  let tagId: string;
  let orgId: string;

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

    const TagModel = (await import("../../tag.model")).default;
    const tag = await new TagModel({
      name: "Old Name",
      orgId: organization._id,
    }).save();
    tagId = tag.id.toString();
  });

  it("should update a tag name", async () => {
    const res = await request(app)
      .patch(`/api/v1/tags/${tagId}`)
      .set("Cookie", [accessToken])
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
  });

  it("should return 403 if a VIEWER tries to update a tag", async () => {
    // Seed a viewer in the SAME organization to specifically test role permissions (requireRole middleware)
    const { user } = await seedUserInOrg(orgId, {}, "VIEWER");
    const viewerToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: user._id.toString(), email: user.email }),
    );

    const res = await request(app)
      .patch(`/api/v1/tags/${tagId}`)
      .set("Cookie", [viewerToken])
      .send({ name: "Viewer Edit" });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/v1/tags/:id", () => {
  let accessToken: string;
  let tagId: string;
  let orgId: string;

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

    const TagModel = (await import("../../tag.model")).default;
    const tag = await new TagModel({
      name: "To Delete",
      orgId: organization._id,
    }).save();
    tagId = tag.id.toString();
  });

  it("should delete a tag", async () => {
    const res = await request(app)
      .delete(`/api/v1/tags/${tagId}`)
      .set("Cookie", [accessToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const TagModel = (await import("../../tag.model")).default;
    const deletedTag = await TagModel.findById(tagId);
    expect(deletedTag).toBeNull();
  });

  it("should return 403 if a MEMBER tries to delete a tag", async () => {
    // Seed a member in the SAME organization to specifically test role permissions (requireRole middleware)
    const { user } = await seedUserInOrg(orgId, {}, "MEMBER");
    const memberToken = createSignedAccessTokenCookie(
      generateAccessToken({ id: user._id.toString(), email: user.email }),
    );

    const res = await request(app)
      .delete(`/api/v1/tags/${tagId}`)
      .set("Cookie", [memberToken]);

    expect(res.status).toBe(403);
  });
});
