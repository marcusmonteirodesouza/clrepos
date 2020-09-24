const os = require("os");
const path = require("path");
const subMonths = require("date-fns/subMonths");

const { getCodeDir, isActive } = require("./lib");

describe("clrepos", () => {
  const repo = {
    pushed_at: "2011-01-26T19:06:43Z",
  };

  describe("getCodeDir", () => {
    it("should return a directory called 'code' inside the user's Home directory", () => {
      const expectedResult = path.join(os.homedir(), "code");

      const result = getCodeDir();

      expect(result).toBe(expectedResult);
    });
  });

  describe("isActive", () => {
    const today = new Date();

    test("Given repo was pushed_at 3 or less months ago then it should return true", () => {
      [0, 1, 2, 3].forEach((n) => {
        const pushedAt = subMonths(today, n).toISOString();

        expect(isActive({ ...repo, pushed_at: pushedAt })).toBe(true);
      });
    });

    test("Given repo was pushed_at more than 3 months ago then it should return false", () => {
      const pushedAt = subMonths(today, 4).toISOString();

      expect(isActive({ ...repo, pushed_at: pushedAt })).toBe(false);
    });
  });
});
