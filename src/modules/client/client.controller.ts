import { Request, Response } from "express";
import ClientService from "./client.service";
import AppError from "@utils/AppError";
import { IErrorPayload } from "src/types";
import { routeTryCatcher } from "@utils/routeTryCatcher";

export const createClient = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { name, email, address, currency, orgId } = req.body;
    const userOrg = req.userOrg!;

    if (userOrg._id.toString() !== orgId) {
      throw AppError.forbidden(
        "You can only create clients for your own organization",
      );
    }

    const result = await ClientService.createClient({
      name,
      email,
      address,
      currency,
      orgId,
    });

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(201).json(result);
  },
);

export const getClients = routeTryCatcher(
  async (req: Request, res: Response) => {
    const userOrg = req.userOrg!;
    const clients = await ClientService.getClientsByOrgId(
      userOrg._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: clients,
    });
  },
);

export const updateClient = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Client ID is required");

    const client = await ClientService.getClientById(id);
    if (!client) throw AppError.notFound("Client not found");

    if (userOrg._id.toString() !== client.orgId.toString()) {
      throw AppError.forbidden(
        "You do not have permission to update this client",
      );
    }

    const result = await ClientService.updateClient(id, req.body);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export const deleteClient = routeTryCatcher(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userOrg = req.userOrg!;

    if (!id) throw AppError.badRequest("Client ID is required");

    const client = await ClientService.getClientById(id);
    if (!client) throw AppError.notFound("Client not found");

    if (userOrg._id.toString() !== client.orgId.toString()) {
      throw AppError.forbidden(
        "You do not have permission to delete this client",
      );
    }

    const result = await ClientService.deleteClient(id);

    if (!result.success) {
      throw AppError.badRequest((result as IErrorPayload).error);
    }

    res.status(200).json(result);
  },
);

export default {
  createClient,
  getClients,
  updateClient,
  deleteClient,
};
