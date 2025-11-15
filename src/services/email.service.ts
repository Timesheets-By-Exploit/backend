import { SendMailClient, SendMailWithTemplatePayload } from "zeptomail";
import {
  FROM_EMAIL,
  ZEPTO_MAIL_URL,
  ZEPTO_MAIL_TOKEN,
  FROM_NAME,
  SUPPORT_EMAIL,
} from "@config/env";

const client = new SendMailClient({
  url: ZEPTO_MAIL_URL,
  token: ZEPTO_MAIL_TOKEN,
});

export async function sendEmailWithTemplate(
  options: SendMailWithTemplatePayload,
) {
  try {
    const res = await client.sendMailWithTemplate({
      ...options,
      from: options.from || {
        name: FROM_NAME,
        address: FROM_EMAIL,
      },
      merge_info: {
        ...(options.merge_info || {}),
        supportEmail: SUPPORT_EMAIL,
      },
    });
    return { success: res.message === "OK", emailSent: res.message === "OK" };
  } catch (err) {
    return { success: false, error: (err as { error: Error }).error.message };
  }
}
