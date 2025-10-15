export const userFixtures = {
  validOwner: {
    email: "owner@example.com",
    password: "StrongPass123!",
    name: "Test Owner",
  },
  noPassword: {
    email: "nopass@example.com",
    name: "No Password User",
  },
  noEmail: {
    password: "StrongPass123!",
    name: "Invalid Email User",
  },
  invalidEmail: {
    email: "not-an-email",
    password: "StrongPass123!",
    name: "Invalid Email User",
  },
};
