import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KpiCard } from "@/components/ui/KpiCard";

const meta: Meta<typeof KpiCard> = {
  title: "UI/KpiCard",
  component: KpiCard,
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", padding: 32, minHeight: 200 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof KpiCard>;

export const Default: Story = {
  args: {
    title: "Revenue",
    value: 12450,
    prefix: "$",
    trend: "+12.5%",
    trendUp: true,
    sparklineData: [30, 45, 38, 52, 48, 61, 55, 70, 65, 78, 72, 85],
  },
};

export const TrendDown: Story = {
  args: {
    title: "Churn Rate",
    value: 8.3,
    suffix: "%",
    trend: "-3.2%",
    trendUp: false,
    sparklineData: [80, 72, 68, 75, 60, 55, 50, 48, 42, 38],
  },
};

export const NoSparkline: Story = {
  args: {
    title: "Active Users",
    value: 1284,
    trend: "+5.1%",
    trendUp: true,
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      <KpiCard
        title="Revenue"
        value={12450}
        prefix="$"
        trend="+12.5%"
        trendUp={true}
        sparklineData={[30, 45, 38, 52, 48, 61, 55, 70, 65, 78]}
      />
      <KpiCard
        title="Customers"
        value={3842}
        trend="+8.1%"
        trendUp={true}
        sparklineData={[20, 28, 35, 42, 40, 50, 55, 60, 58, 65]}
      />
      <KpiCard
        title="Bounce Rate"
        value={24.5}
        suffix="%"
        trend="-2.3%"
        trendUp={false}
        sparklineData={[40, 38, 35, 32, 30, 28, 26, 25, 24, 24]}
      />
    </div>
  ),
};
