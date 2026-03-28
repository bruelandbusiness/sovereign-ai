import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RoiCalculator } from "./RoiCalculator";

const meta: Meta<typeof RoiCalculator> = {
  title: "UI/RoiCalculator",
  component: RoiCalculator,
  parameters: {
    backgrounds: { default: "dark" },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "2rem", width: "520px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RoiCalculator>;

export const Default: Story = {
  args: {},
};
