import {
  CreateTagInput,
  UpdateTagInput,
  TagOutput,
  TagBase,
} from "./tag.types";
import TagModel from "./tag.model";
import { ISuccessPayload, IErrorPayload, Mappable } from "src/types";

const mapToOutput = (doc: TagBase & Mappable): TagOutput => {
  return {
    id: doc._id.toString(),
    name: doc.name,
    color: doc.color ?? undefined,
    orgId: doc.orgId.toString(),
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const TagService = {
  createTag: async (
    input: CreateTagInput,
  ): Promise<ISuccessPayload<TagOutput> | IErrorPayload> => {
    try {
      const existingTag = await TagModel.findOne({
        name: input.name,
        orgId: input.orgId,
      });

      if (existingTag) {
        return {
          success: false,
          error: "Tag with this name already exists in the organization",
        };
      }

      const tag = new TagModel({
        name: input.name,
        color: input.color,
        orgId: input.orgId,
      });

      await tag.save();

      return {
        success: true,
        data: mapToOutput(tag as unknown as TagBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  getTagsByOrgId: async (orgId: string): Promise<TagOutput[]> => {
    const tags = await TagModel.find({ orgId, status: "ACTIVE" });
    return tags.map((doc) => mapToOutput(doc as unknown as TagBase & Mappable));
  },

  getTagById: async (id: string): Promise<TagOutput | null> => {
    const tag = await TagModel.findById(id);
    return tag ? mapToOutput(tag as unknown as TagBase & Mappable) : null;
  },

  updateTag: async (
    id: string,
    input: UpdateTagInput,
  ): Promise<ISuccessPayload<TagOutput> | IErrorPayload> => {
    try {
      const tag = await TagModel.findById(id);
      if (!tag) {
        return {
          success: false,
          error: "Tag not found",
        };
      }

      if (input.name) tag.name = input.name;
      if (input.color) tag.color = input.color;
      if (input.status) tag.status = input.status;

      await tag.save();

      return {
        success: true,
        data: mapToOutput(tag as unknown as TagBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  deleteTag: async (
    id: string,
  ): Promise<ISuccessPayload<{ message: string }> | IErrorPayload> => {
    try {
      const tag = await TagModel.findById(id);
      if (!tag) {
        return {
          success: false,
          error: "Tag not found",
        };
      }

      await TagModel.findByIdAndDelete(id);

      return {
        success: true,
        data: { message: "Tag deleted successfully" },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },
};

export default TagService;
