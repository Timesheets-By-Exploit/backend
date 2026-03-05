import {
  CreateClientInput,
  UpdateClientInput,
  ClientOutput,
  ClientBase,
} from "./client.types";
import ClientModel from "./client.model";
import { ISuccessPayload, IErrorPayload, Mappable } from "src/types";

const mapToOutput = (doc: ClientBase & Mappable): ClientOutput => {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email ?? undefined,
    address: doc.address ?? undefined,
    currency: doc.currency,
    orgId: doc.orgId.toString(),
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const ClientService = {
  createClient: async (
    input: CreateClientInput,
  ): Promise<ISuccessPayload<ClientOutput> | IErrorPayload> => {
    try {
      const existingClient = await ClientModel.findOne({
        name: input.name,
        orgId: input.orgId,
      });

      if (existingClient) {
        return {
          success: false,
          error: "Client with this name already exists in the organization",
        };
      }

      const client = new ClientModel(input);
      await client.save();

      return {
        success: true,
        data: mapToOutput(client as unknown as ClientBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  getClientsByOrgId: async (orgId: string): Promise<ClientOutput[]> => {
    const clients = await ClientModel.find({ orgId, status: "ACTIVE" });
    return clients.map((doc) =>
      mapToOutput(doc as unknown as ClientBase & Mappable),
    );
  },

  getClientById: async (id: string): Promise<ClientOutput | null> => {
    const client = await ClientModel.findById(id);
    return client
      ? mapToOutput(client as unknown as ClientBase & Mappable)
      : null;
  },

  updateClient: async (
    id: string,
    input: UpdateClientInput,
  ): Promise<ISuccessPayload<ClientOutput> | IErrorPayload> => {
    try {
      const client = await ClientModel.findById(id);
      if (!client) {
        return {
          success: false,
          error: "Client not found",
        };
      }

      Object.assign(client, input);
      await client.save();

      return {
        success: true,
        data: mapToOutput(client as unknown as ClientBase & Mappable),
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },

  deleteClient: async (
    id: string,
  ): Promise<ISuccessPayload<{ message: string }> | IErrorPayload> => {
    try {
      const client = await ClientModel.findById(id);
      if (!client) {
        return {
          success: false,
          error: "Client not found",
        };
      }

      await ClientModel.findByIdAndDelete(id);

      return {
        success: true,
        data: { message: "Client deleted successfully" },
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },
};

export default ClientService;
