import { faker } from "@faker-js/faker";

export const OrganizationFactory = {
  generate: (
    overrides: Partial<{ [x: string]: string | number | undefined }> = {},
  ) => ({
    name: faker.company.name(),
    size: faker.number.int(),
    ...overrides,
  }),
};
