import { faker } from "@faker-js/faker";

export const OrganizationFactory = {
  generate: (overrides: Partial<{}> = {}) => ({
    name: faker.company.name(),
    size: faker.number.int(),
    ...overrides,
  }),
};
