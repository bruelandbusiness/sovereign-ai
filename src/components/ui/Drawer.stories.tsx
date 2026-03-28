import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Drawer } from "./Drawer";

const meta: Meta<typeof Drawer> = {
  title: "UI/Drawer",
  component: Drawer,
  parameters: {
    backgrounds: { default: "dark" },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "2rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Drawer>;

function DrawerDemo({ side = "right" }: { side?: "right" | "left" | "bottom" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Open {side} drawer
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={`${side.charAt(0).toUpperCase() + side.slice(1)} Drawer`}
        description="This is a sample drawer component."
        side={side}
      >
        <p style={{ color: "rgba(255,255,255,0.7)" }}>
          Drawer content goes here. This panel slides in from the {side}.
        </p>
      </Drawer>
    </>
  );
}

export const Default: Story = {
  render: () => <DrawerDemo side="right" />,
};

export const LeftSide: Story = {
  render: () => <DrawerDemo side="left" />,
};

export const BottomSheet: Story = {
  render: () => <DrawerDemo side="bottom" />,
};
