import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ServiceCard } from "@/components/home/ServiceCard";
import { SERVICES } from "@/lib/constants";

const meta: Meta<typeof ServiceCard> = {
  title: "Components/ServiceCard",
  component: ServiceCard,
};
export default meta;

type Story = StoryObj<typeof ServiceCard>;

export const Default: Story = {
  args: {
    service: SERVICES[0],
  },
};

export const Popular: Story = {
  args: {
    service: SERVICES.find((s) => s.popular) || SERVICES[0],
  },
};

export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        maxWidth: 900,
      }}
    >
      {SERVICES.slice(0, 6).map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  ),
};
