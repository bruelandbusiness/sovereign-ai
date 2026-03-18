import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KPICard } from "@/components/dashboard/KPICard";
import { Users, Phone, Star, Eye } from "lucide-react";

const meta: Meta<typeof KPICard> = {
  title: "Components/KPICard",
  component: KPICard,
};
export default meta;

type Story = StoryObj<typeof KPICard>;

export const Leads: Story = {
  args: {
    label: "Leads This Month",
    value: 47,
    change: "+23%",
    changeType: "positive",
    icon: Users,
    iconColor: "bg-blue-500/10 text-blue-400",
    delay: 0,
  },
};

export const Calls: Story = {
  args: {
    label: "Calls Answered (AI)",
    value: 93,
    suffix: "%",
    change: "+5%",
    changeType: "positive",
    subtext: "38 of 41 calls",
    icon: Phone,
    iconColor: "bg-emerald-500/10 text-emerald-400",
    delay: 0,
  },
};

export const AllKPIs: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      <KPICard
        label="Leads"
        value={47}
        change="+23%"
        changeType="positive"
        icon={Users}
        iconColor="bg-blue-500/10 text-blue-400"
        delay={0}
      />
      <KPICard
        label="Calls (AI)"
        value={93}
        suffix="%"
        change="+5%"
        changeType="positive"
        subtext="38 of 41"
        icon={Phone}
        iconColor="bg-emerald-500/10 text-emerald-400"
        delay={0}
      />
      <KPICard
        label="Review Score"
        value={4.8}
        decimals={1}
        subtext="67 reviews"
        icon={Star}
        iconColor="bg-amber-500/10 text-amber-400"
        delay={0}
      />
      <KPICard
        label="Visitors"
        value={2847}
        change="+18%"
        changeType="positive"
        icon={Eye}
        iconColor="bg-purple-500/10 text-purple-400"
        delay={0}
      />
    </div>
  ),
};
