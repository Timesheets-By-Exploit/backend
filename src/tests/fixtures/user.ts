import { faker } from "@faker-js/faker";

export const userFixtures = {
  noEmail: {
    name: "John Doe",
    password: "SecurePass123",
  },
  noPassword: {
    name: "John Doe",
    email: "john@example.com",
  },
  invalidEmail: {
    name: "Test User",
    email: "not-an-email",
    password: "SomePass123",
  },
};
