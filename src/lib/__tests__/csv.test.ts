import { describe, it, expect } from "vitest";
import { toCSV } from "../csv";

describe("toCSV", () => {
  it("converts an array of objects to CSV with header row", () => {
    const rows = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];

    const csv = toCSV(rows);

    expect(csv).toBe("name,age\nAlice,30\nBob,25\n");
  });

  it("returns empty string for an empty array", () => {
    expect(toCSV([])).toBe("");
  });

  it("escapes values containing commas", () => {
    const rows = [{ city: "Lancaster, PA", state: "PA" }];
    const csv = toCSV(rows);

    expect(csv).toBe('city,state\n"Lancaster, PA",PA\n');
  });

  it("escapes values containing double quotes", () => {
    const rows = [{ phrase: 'She said "hello"' }];
    const csv = toCSV(rows);

    expect(csv).toBe('phrase\n"She said ""hello"""\n');
  });

  it("escapes values containing newlines", () => {
    const rows = [{ note: "line1\nline2" }];
    const csv = toCSV(rows);

    expect(csv).toBe('note\n"line1\nline2"\n');
  });

  it("escapes values containing carriage returns", () => {
    const rows = [{ note: "line1\r\nline2" }];
    const csv = toCSV(rows);

    expect(csv).toBe('note\n"line1\r\nline2"\n');
  });

  it("uses custom column selection and order", () => {
    const rows = [
      { a: 1, b: 2, c: 3 },
      { a: 4, b: 5, c: 6 },
    ];

    const csv = toCSV(rows, ["c", "a"]);

    expect(csv).toBe("c,a\n3,1\n6,4\n");
  });

  it("outputs empty string for null and undefined values", () => {
    const rows = [{ x: null, y: undefined, z: "ok" }];
    const csv = toCSV(rows, ["x", "y", "z"]);

    expect(csv).toBe("x,y,z\n,,ok\n");
  });

  it("handles a single row", () => {
    const rows = [{ id: 1, name: "test" }];
    const csv = toCSV(rows);
    expect(csv).toBe("id,name\n1,test\n");
  });

  it("handles multiple rows with consistent structure", () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
      { a: 5, b: 6 },
    ];
    const csv = toCSV(rows);
    const lines = csv.split("\n");
    // Header + 3 data rows + trailing newline
    expect(lines.length).toBe(5);
    expect(lines[0]).toBe("a,b");
    expect(lines[4]).toBe("");
  });

  it("converts boolean and numeric values to strings", () => {
    const rows = [{ flag: true, count: 42, rate: 3.14 }];
    const csv = toCSV(rows);
    expect(csv).toBe("flag,count,rate\ntrue,42,3.14\n");
  });

  it("handles column names that contain commas", () => {
    const rows = [{ "first,last": "value" }];
    const csv = toCSV(rows);
    // The header column name itself should be escaped
    expect(csv).toBe('"first,last"\nvalue\n');
  });

  it("handles values with both commas and quotes", () => {
    const rows = [{ desc: 'Price is $5, or "cheap"' }];
    const csv = toCSV(rows);
    expect(csv).toBe('desc\n"Price is $5, or ""cheap"""\n');
  });

  it("derives columns from first row keys when columns not specified", () => {
    const rows = [
      { x: 1, y: 2 },
      { x: 3, y: 4, z: 5 },
    ];
    const csv = toCSV(rows);
    // Only x and y columns from first row
    expect(csv).toBe("x,y\n1,2\n3,4\n");
  });

  it("outputs empty values for missing columns in later rows", () => {
    const rows = [
      { a: 1, b: 2, c: 3 },
      { a: 4 },
    ];
    const csv = toCSV(rows);
    expect(csv).toBe("a,b,c\n1,2,3\n4,,\n");
  });

  it("handles values with unicode characters", () => {
    const rows = [{ name: "\u00C9milie", city: "Montr\u00E9al" }];
    const csv = toCSV(rows);
    expect(csv).toBe("name,city\n\u00C9milie,Montr\u00E9al\n");
  });

  it("handles very large number of rows", () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i, val: `row-${i}` }));
    const csv = toCSV(rows);
    const lines = csv.split("\n");
    // header + 1000 data rows + trailing newline
    expect(lines.length).toBe(1002);
  });

  it("handles object values by stringifying them", () => {
    const rows = [{ data: { nested: true } }];
    const csv = toCSV(rows);
    expect(csv).toContain("[object Object]");
  });

  it("handles Date values by converting to string", () => {
    const d = new Date("2026-01-15T00:00:00Z");
    const rows = [{ date: d }];
    const csv = toCSV(rows);
    expect(csv).toContain("2026");
  });
});
