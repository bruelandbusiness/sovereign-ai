import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: (_, tag) => tag }),
  AnimatePresence: ({ children }: any) => children,
  useMotionValue: () => ({ get: () => 0, set: () => {}, on: () => () => {} }),
  useTransform: () => ({ get: () => 0, on: () => () => {} }),
  animate: () => ({ stop: () => {} }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => ({
  ChevronUp: (props: any) => <span data-testid="icon-chevron-up" {...props} />,
  ChevronDown: (props: any) => <span data-testid="icon-chevron-down" {...props} />,
  Search: (props: any) => <span data-testid="icon-search" {...props} />,
}));

import { AnimatedDataTable } from "./AnimatedDataTable";

interface TestRow {
  id: string;
  name: string;
  role: string;
  age: string;
}

const columns = [
  { key: "name" as const, label: "Name", sortable: true },
  { key: "role" as const, label: "Role", sortable: true },
  { key: "age" as const, label: "Age", sortable: true },
];

const data: TestRow[] = [
  { id: "1", name: "Alice", role: "Engineer", age: "30" },
  { id: "2", name: "Bob", role: "Designer", age: "25" },
  { id: "3", name: "Charlie", role: "Manager", age: "40" },
];

describe("AnimatedDataTable", () => {
  it("renders all rows", () => {
    render(<AnimatedDataTable columns={columns} data={data} />);
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("Charlie")).toBeTruthy();
    expect(screen.getByText("3 of 3 results")).toBeTruthy();
  });

  it("filters by search text", () => {
    render(<AnimatedDataTable columns={columns} data={data} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "alice" } });

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.queryByText("Bob")).toBeNull();
    expect(screen.queryByText("Charlie")).toBeNull();
    expect(screen.getByText("1 of 3 results")).toBeTruthy();
  });

  it("sorts by column click", () => {
    render(<AnimatedDataTable columns={columns} data={data} />);

    // Click the "Name" column header to sort ascending (already default order)
    fireEvent.click(screen.getByText("Name"));

    // Get all cells in the first column
    const rows = screen.getAllByRole("row");
    // rows[0] is the header, rows[1..3] are data rows
    const firstColumnCells = rows.slice(1).map((row) => {
      const cells = row.querySelectorAll("td");
      return cells[0]?.textContent;
    });

    // Ascending sort by name: Alice, Bob, Charlie
    expect(firstColumnCells).toEqual(["Alice", "Bob", "Charlie"]);

    // Click again to sort descending
    fireEvent.click(screen.getByText("Name"));
    const rowsAfter = screen.getAllByRole("row");
    const descCells = rowsAfter.slice(1).map((row) => {
      const cells = row.querySelectorAll("td");
      return cells[0]?.textContent;
    });

    // Descending: Charlie, Bob, Alice
    expect(descCells).toEqual(["Charlie", "Bob", "Alice"]);
  });
});
