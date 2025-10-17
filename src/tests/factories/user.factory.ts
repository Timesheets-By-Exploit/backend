import { faker } from "@faker-js/faker";

export const UserFactory = {
  generate: (overrides: Partial<{}> = {}) => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: "SecurePass123!",
    ...overrides,
  }),
};
