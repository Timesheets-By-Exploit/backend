import { faker } from "@faker-js/faker";

export const UserFactory = {
  generate: (
    overrides: Partial<{ [x: string]: string | number | undefined }> = {},
  ) => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: "SecurePass123!",
    ...overrides,
  }),
};
