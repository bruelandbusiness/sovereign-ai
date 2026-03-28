import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GradientButton } from "@/components/shared/GradientButton";
import { ArrowRight, Zap } from "lucide-react";

const meta: Meta<typeof GradientButton> = {
  title: "Components/GradientButton",
  component: GradientButton,
  argTypes: {
    variant: {
      control: "select",
      options: ["gradient", "outline", "ghost"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof GradientButton>;

export const Gradient: Story = {
  args: { variant: "gradient", size: "md", children: "Book Strategy Call" },
};

export const Outline: Story = {
  args: { variant: "outline", size: "md", children: "View Pricing" },
};

export const Ghost: Story = {
  args: { variant: "ghost", size: "md", children: "Learn More" },
};

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12 }}>
      <GradientButton>
        <Zap size={16} /> Get Started
      </GradientButton>
      <GradientButton variant="outline">
        View Services <ArrowRight size={16} />
      </GradientButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <GradientButton size="sm">Small</GradientButton>
      <GradientButton size="md">Medium</GradientButton>
      <GradientButton size="lg">Large</GradientButton>
    </div>
  ),
};
