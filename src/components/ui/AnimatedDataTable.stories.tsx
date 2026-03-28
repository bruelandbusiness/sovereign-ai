import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedDataTable } from "./AnimatedDataTable";

interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  value: number;
}

const sampleData: Lead[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", status: "Qualified", value: 12500 },
  { id: "2", name: "Bob Smith", email: "bob@example.com", status: "New", value: 8200 },
  { id: "3", name: "Carol White", email: "carol@example.com", status: "Contacted", value: 15000 },
  { id: "4", name: "Dan Brown", email: "dan@example.com", status: "Qualified", value: 22000 },
  { id: "5", name: "Eve Davis", email: "eve@example.com", status: "New", value: 6700 },
  { id: "6", name: "Frank Miller", email: "frank@example.com", status: "Contacted", value: 9100 },
  { id: "7", name: "Grace Lee", email: "grace@example.com", status: "Qualified", value: 31000 },
  { id: "8", name: "Hank Wilson", email: "hank@example.com", status: "New", value: 4500 },
];

const statusColors: Record<string, string> = {
  New: "#4c85ff",
  Contacted: "#f59e0b",
  Qualified: "#22d3a1",
};

const columns = [
  { key: "name" as const, label: "Name", sortable: true },
  { key: "email" as const, label: "Email" },
  {
    key: "status" as const,
    label: "Status",
    sortable: true,
    render: (value: Lead[keyof Lead]) => (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 500,
          background: `${statusColors[value as string] ?? "#4c85ff"}20`,
          color: statusColors[value as string] ?? "#4c85ff",
        }}
      >
        {String(value)}
      </span>
    ),
  },
  {
    key: "value" as const,
    label: "Value",
    sortable: true,
    render: (value: Lead[keyof Lead]) =>
      `$${Number(value).toLocaleString()}`,
  },
];

const meta: Meta<typeof AnimatedDataTable<Lead>> = {
  title: "UI/AnimatedDataTable",
  component: AnimatedDataTable,
  parameters: {
    backgrounds: { default: "dark" },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "2rem", width: "720px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AnimatedDataTable<Lead>>;

export const Default: Story = {
  args: {
    columns,
    data: sampleData,
    searchable: true,
    onRowClick: (row) => console.log("Clicked row:", row),
  },
};

export const Sortable: Story = {
  args: {
    columns,
    data: sampleData,
    searchable: false,
    onRowClick: (row) => console.log("Clicked row:", row),
  },
};

export const Searchable: Story = {
  args: {
    columns,
    data: sampleData,
    searchable: true,
    searchKeys: ["name", "email", "status"],
    onRowClick: (row) => console.log("Clicked row:", row),
  },
};
