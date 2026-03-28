import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActivityTimeline } from "@/components/ui/ActivityTimeline";

const meta: Meta<typeof ActivityTimeline> = {
  title: "UI/ActivityTimeline",
  component: ActivityTimeline,
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", padding: 32, maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ActivityTimeline>;

export const Default: Story = {
  args: {
    items: [
      {
        id: "1",
        title: "Deal closed with Acme Corp",
        description: "Contract signed for $45,000 annual plan.",
        time: "2 min ago",
        type: "success",
      },
      {
        id: "2",
        title: "Payment overdue notice",
        description: "Invoice #1042 is 15 days past due.",
        time: "1 hr ago",
        type: "warning",
      },
      {
        id: "3",
        title: "New lead assigned",
        description: "Globex Inc added to your pipeline.",
        time: "3 hrs ago",
        type: "info",
      },
      {
        id: "4",
        title: "Campaign launched",
        description: "Q2 outreach campaign is now live.",
        time: "5 hrs ago",
        type: "success",
      },
      {
        id: "5",
        title: "Meeting scheduled",
        description: "Demo call with Stark Industries on Friday.",
        time: "1 day ago",
        type: "info",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
