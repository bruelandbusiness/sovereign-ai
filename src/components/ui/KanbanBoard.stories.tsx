import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KanbanBoard } from "@/components/ui/KanbanBoard";

const meta: Meta<typeof KanbanBoard> = {
  title: "UI/KanbanBoard",
  component: KanbanBoard,
  argTypes: {
    onCardMove: { action: "card-moved" },
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", padding: 32, minHeight: 400 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof KanbanBoard>;

export const Default: Story = {
  args: {
    columns: [
      {
        id: "new-leads",
        title: "New Leads",
        color: "#3b82f6",
        items: [
          { id: "1", title: "Acme Corp", subtitle: "Enterprise plan inquiry", value: "$24k" },
          { id: "2", title: "Globex Inc", subtitle: "Demo requested", value: "$18k" },
          { id: "3", title: "Initech", subtitle: "Inbound lead", value: "$12k" },
        ],
      },
      {
        id: "in-progress",
        title: "In Progress",
        color: "#f59e0b",
        items: [
          { id: "4", title: "Wayne Enterprises", subtitle: "Proposal sent", value: "$45k" },
          { id: "5", title: "Stark Industries", subtitle: "Negotiation phase", value: "$62k" },
        ],
      },
      {
        id: "closed-won",
        title: "Closed Won",
        color: "#22c55e",
        items: [
          { id: "6", title: "Oscorp", subtitle: "Contract signed", value: "$38k" },
          { id: "7", title: "LexCorp", subtitle: "Onboarding started", value: "$55k" },
          { id: "8", title: "Cyberdyne Systems", subtitle: "Active customer", value: "$29k" },
        ],
      },
    ],
  },
};

export const SalesPipeline: Story = {
  args: {
    columns: [
      {
        id: "new",
        title: "New",
        color: "#6366f1",
        items: [
          { id: "p1", title: "Acme Corp", subtitle: "Inbound lead", value: "$24k" },
          { id: "p2", title: "Globex Inc", subtitle: "Website signup", value: "$18k" },
        ],
      },
      {
        id: "contacted",
        title: "Contacted",
        color: "#3b82f6",
        items: [
          { id: "p3", title: "Initech", subtitle: "Email sent", value: "$12k" },
        ],
      },
      {
        id: "qualified",
        title: "Qualified",
        color: "#f59e0b",
        items: [
          { id: "p4", title: "Wayne Enterprises", subtitle: "Discovery call done", value: "$45k" },
        ],
      },
      {
        id: "proposal",
        title: "Proposal",
        color: "#f97316",
        items: [
          { id: "p5", title: "Stark Industries", subtitle: "Proposal sent", value: "$62k" },
        ],
      },
      {
        id: "won",
        title: "Won",
        color: "#22c55e",
        items: [
          { id: "p6", title: "Oscorp", subtitle: "Contract signed", value: "$38k" },
        ],
      },
      {
        id: "lost",
        title: "Lost",
        color: "#ef4444",
        items: [],
      },
    ],
  },
};

export const EmptyColumns: Story = {
  args: {
    columns: [
      { id: "new-leads", title: "New Leads", color: "#3b82f6", items: [] },
      { id: "in-progress", title: "In Progress", color: "#f59e0b", items: [] },
      { id: "closed-won", title: "Closed Won", color: "#22c55e", items: [] },
    ],
  },
};
