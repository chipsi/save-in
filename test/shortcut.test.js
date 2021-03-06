const constants = require("../src/constants.js");
const shortcut = require("../src/shortcut.js");

describe("shortcut content creation", () => {
  let oldShortcutTypes;
  let SHORTCUT_TYPES;

  beforeAll(() => {
    oldShortcutTypes = window.SHORTCUT_TYPES;
    SHORTCUT_TYPES = constants.SHORTCUT_TYPES;
    window.SHORTCUT_TYPES = constants.SHORTCUT_TYPES;
  });

  afterAll(() => {
    window.SHORTCUT_TYPES = oldShortcutTypes;
  });

  test("creates a HTML redirect shortcut", () => {
    const expected = 'window.location.href = "foo"';
    expect(
      shortcut.makeShortcutContent(SHORTCUT_TYPES.HTML_REDIRECT, "foo")
    ).toContain(expected);
  });

  test("creates a Mac URL shortcut", () => {
    const expected = "[InternetShortcut]\nURL=foo";
    expect(shortcut.makeShortcutContent(SHORTCUT_TYPES.MAC, "foo")).toBe(
      expected
    );
  });

  test("creates a Windows URL shortcut", () => {
    const expected = "[InternetShortcut]\r\nURL=foo";
    expect(shortcut.makeShortcutContent(SHORTCUT_TYPES.WINDOWS, "foo")).toBe(
      expected
    );
  });

  test("creates a Freedesktop URL shortcut without a title", () => {
    const expected =
      "[Desktop Entry]\nEncoding=UTF-8\nIcon=text-html\nType=Link\nName=foo\nTitle=foo\nURL=foo\n[InternetShortcut]\nURL=foo";
    expect(
      shortcut.makeShortcutContent(SHORTCUT_TYPES.FREEDESKTOP, "foo")
    ).toBe(expected);
  });

  test("creates a Freedesktop URL shortcut with a title", () => {
    const expected =
      "[Desktop Entry]\nEncoding=UTF-8\nIcon=text-html\nType=Link\nName=bar\nTitle=bar\nURL=foo\n[InternetShortcut]\nURL=foo";
    expect(
      shortcut.makeShortcutContent(SHORTCUT_TYPES.FREEDESKTOP, "foo", "bar")
    ).toBe(expected);
  });
});
