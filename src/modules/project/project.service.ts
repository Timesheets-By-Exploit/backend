import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectOutput,
  ProjectBase,
} from "./project.types";
import ProjectModel from "./project.model";
import { ISuccessPayload, IErrorPayload, Mappable } from "src/types";

const mapToOutput = (doc: ProjectBase & Mappable): ProjectOutput => {
  const clientId = doc.clientId as unknown as
    | { _id?: { toString(): string } }
    | { toString(): string };
  return {
    id: doc._id.toString(),
    name: doc.name,
    clientId:
      ("_id" in clientId ? clientId._id?.toString() : clientId.toString()) ||
      "",
    orgId: doc.orgId.toString(),
    color: doc.color,
    isBillable: doc.isBillable,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const ProjectService = {
  createProject: async (
    input: CreateProjectInput,
  ): Promise<ISuccessPayload<ProjectOutput> | IErrorPayload> => {
    try {
      const existingProject = await ProjectModel.findOne({
        name: input.name,
        orgId: input.orgId,
      });

      if (existingProject) {
        return {
          success: false,
          error: "Project with this name already exists in the organization",
        };
      }

      const project = new ProjectModel(input);
      await project.save();

      return {
        success: true,
        data: mapToOutput(project as unknown as ProjectBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  getProjectsByOrgId: async (orgId: string): Promise<ProjectOutput[]> => {
    const projects = await ProjectModel.find({
      orgId,
      status: "ACTIVE",
    }).populate("clientId");
    return projects.map((doc) =>
      mapToOutput(doc as unknown as ProjectBase & Mappable),
    );
  },

  getProjectById: async (id: string): Promise<ProjectOutput | null> => {
    const project = await ProjectModel.findById(id).populate("clientId");
    return project
      ? mapToOutput(project as unknown as ProjectBase & Mappable)
      : null;
  },

  updateProject: async (
    id: string,
    input: UpdateProjectInput,
  ): Promise<ISuccessPayload<ProjectOutput> | IErrorPayload> => {
    try {
      const project = await ProjectModel.findById(id);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
        };
      }

      Object.assign(project, input);
      await project.save();

      return {
        success: true,
        data: mapToOutput(project as unknown as ProjectBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  deleteProject: async (
    id: string,
  ): Promise<ISuccessPayload<{ message: string }> | IErrorPayload> => {
    try {
      const project = await ProjectModel.findById(id);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
        };
      }

      await ProjectModel.findByIdAndDelete(id);

      return {
        success: true,
        data: { message: "Project deleted successfully" },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },
};

export default ProjectService;
