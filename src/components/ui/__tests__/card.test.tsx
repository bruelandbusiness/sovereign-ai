import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies additional className", () => {
    const { container } = render(<Card className="custom">Content</Card>);
    expect(container.firstElementChild!.classList.contains("custom")).toBe(true);
  });

  it("forwards HTML attributes", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("renders metric variant with top border", () => {
    const { container } = render(<Card variant="metric">Metric</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.borderTop).toBe("2px solid var(--primary)");
  });

  it("renders status variant with color-coded top border", () => {
    const { container } = render(
      <Card variant="status" statusColor="warning">Warning</Card>,
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.borderTop).toBe("2px solid var(--warning)");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header text</CardHeader>);
    expect(screen.getByText("Header text")).toBeInTheDocument();
  });

  it("passes className", () => {
    const { container } = render(<CardHeader className="hdr">H</CardHeader>);
    expect(container.firstElementChild!.classList.contains("hdr")).toBe(true);
  });
});

describe("CardTitle", () => {
  it("renders as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Title");
  });
});

describe("CardDescription", () => {
  it("renders paragraph text", () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Body content</CardContent>);
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });
});

describe("Card composition", () => {
  it("renders a fully composed card", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Card</CardTitle>
          <CardDescription>A description</CardDescription>
        </CardHeader>
        <CardContent>Main body</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    );

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("My Card");
    expect(screen.getByText("A description")).toBeInTheDocument();
    expect(screen.getByText("Main body")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();
  });
});
