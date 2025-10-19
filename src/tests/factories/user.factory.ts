import { faker } from "@faker-js/faker";

export const UserFactory = {
  generate: (overrides: Partial<{}> = {}) => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: "SecurePass123!",
    ...overrides,
  }),
};
