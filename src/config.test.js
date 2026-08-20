describe("API_BASE", () => {
  const ORIGINAL_ENV = process.env.REACT_APP_API_BASE;

  afterEach(() => {
    process.env.REACT_APP_API_BASE = ORIGINAL_ENV;
    jest.resetModules();
  });

  test("falls back to localhost:5000 when REACT_APP_API_BASE is not set", () => {
    delete process.env.REACT_APP_API_BASE;
    const { API_BASE } = require("./config");
    expect(API_BASE).toBe("http://localhost:5000");
  });

  test("uses REACT_APP_API_BASE when set (production case)", () => {
    process.env.REACT_APP_API_BASE = "https://api.citimart.com";
    const { API_BASE } = require("./config");
    expect(API_BASE).toBe("https://api.citimart.com");
  });
});
