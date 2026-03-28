import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SeverityBadge } from "@/components/shared/SeverityBadge";

const meta: Meta<typeof SeverityBadge> = {
  title: "Components/SeverityBadge",
  component: SeverityBadge,
  argTypes: {
    severity: { control: "select", options: ["critical", "warning", "good"] },
  },
};
export default meta;

type Story = StoryObj<typeof SeverityBadge>;

export const Critical: Story = { args: { severity: "critical" } };
export const Warning: Story = { args: { severity: "warning" } };
export const Good: Story = { args: { severity: "good" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12 }}>
      <SeverityBadge severity="critical" />
      <SeverityBadge severity="warning" />
      <SeverityBadge severity="good" />
    </div>
  ),
};
