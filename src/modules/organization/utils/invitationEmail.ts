import { sendEmailWithTemplate } from "@services/email.service";
import { FRONTEND_BASE_URL, INVITATION_TEMPLATE_KEY } from "@config/env";
import { IOrganization } from "../organization.types";
import { InviteMemberInput } from "../organization.types";

type SendInvitationEmailParams = {
  email: string;
  role: InviteMemberInput["role"];
  organization: IOrganization;
  invitationToken: string;
  ownersName: string;
};

export const sendInvitationEmail = async ({
  email,
  role,
  organization,
  invitationToken,
  ownersName,
}: SendInvitationEmailParams) => {
  const inviteeName = email.split("@")[0] || "User";
  const acceptLink = `${FRONTEND_BASE_URL}/accept-invitation?token=${invitationToken}`;
  const verifyAccountLink = `${FRONTEND_BASE_URL}/verify-account`;

  return await sendEmailWithTemplate({
    to: [
      {
        email_address: {
          address: email,
          name: inviteeName,
        },
      },
    ],
    merge_info: {
      role,
      organizationName: organization.name,
      name: inviteeName,
      acceptLink,
      verify_account_link: verifyAccountLink,
      invitationLinkExpiry: "7 days",
      ownersName,
    },
    subject: `Invitation to join ${organization.name}`,
    mail_template_key: INVITATION_TEMPLATE_KEY,
    template_alias: "invitation",
  });
};
