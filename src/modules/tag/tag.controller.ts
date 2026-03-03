import { Request, Response } from "express";
import TagService from "./tag.service";
import AppError from "@utils/AppError";
import { IErrorPayload } from "src/types";
import { routeTryCatcher } from "@utils/routeTryCatcher";

export const createTag = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { name, color, orgId } = req.body;
    const userOrg = req.userOrg!;

    if (userOrg._id.toString() !== orgId) {
      throw AppError.forbidden(
        "You can only create tags for your own organization",
      );
    }

    const result = await TagService.createTag({ name, color, orgId });

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(201).json(result);
  },
);

export const getTags = routeTryCatcher(async (req: Request, res: Response) => {
  const userOrg = req.userOrg!;
  const tags = await TagService.getTagsByOrgId(userOrg._id.toString());

  res.status(200).json({
    success: true,
    data: tags,
  });
});

export const updateTag = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Tag ID is required");

    const tag = await TagService.getTagById(id);
    if (!tag) throw AppError.notFound("Tag not found");

    if (userOrg._id.toString() !== tag.orgId.toString()) {
      throw AppError.forbidden("You do not have permission to update this tag");
    }

    const result = await TagService.updateTag(id, req.body);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export const deleteTag = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Tag ID is required");

    const tag = await TagService.getTagById(id);
    if (!tag) throw AppError.notFound("Tag not found");

    if (userOrg._id.toString() !== tag.orgId.toString()) {
      throw AppError.forbidden("You do not have permission to delete this tag");
    }

    const result = await TagService.deleteTag(id);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export default {
  createTag,
  getTags,
  updateTag,
  deleteTag,
};
