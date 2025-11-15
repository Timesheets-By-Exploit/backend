declare module "zeptomail" {
  export type SendMailWithTemplatePayload = {
    from?: {
      address: string;
      name: string;
    };
    mail_template_key: string;
    template_alias: string;
    to: {
      email_address: {
        address: string;
        name: string;
      };
    }[];
    subject?: string;
    content?: Array<{ type: string; value: string }>;
    cc?: [
      {
        email_address: {
          address: string;
          name: string;
        };
      },
    ];
    bcc?: [
      {
        email_address: {
          address: string;
          name: string;
        };
      },
    ];
    merge_info?: {
      [x: string]: string | number | boolean;
    };
    reply_to?: [
      {
        address: string;
        name: string;
      },
    ];
    client_reference?: string;
    mime_headers?: {
      [x: string]: string;
    };
  };

  export class SendMailClient {
    constructor(options?: { url: string; token?: string } | string);
    sendMailWithTemplate(payload: SendMailPayload): Promise<any>;
  }

  export { SendMailClient };
}
