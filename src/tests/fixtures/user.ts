export const userFixtures = {
  noEmail: {
    firstName: "John",
    lastName: "Doe",
    password: "SecurePass123",
  },
  noFirstName: {
    lastName: "Doe",
    email: "johndoe@mail.com",
    password: "SecurePass123",
  },
  noLastName: {
    firstName: "John",
    email: "johndoe@mail.com",
    password: "SecurePass123",
  },
  noPassword: {
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@mail.com",
  },
  invalidEmail: {
    name: "Test User",
    email: "not-an-email",
    password: "SomePass123",
  },
};
