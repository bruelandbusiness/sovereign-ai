import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DatePicker } from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "UI/DatePicker",
  component: DatePicker,
  parameters: {
    backgrounds: { default: "dark" },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "2rem", width: "320px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  args: {
    placeholder: "Select date",
    onChange: (date: Date) => console.log("Selected:", date),
  },
};

export const WithMinDate: Story = {
  args: {
    placeholder: "Select a future date",
    minDate: new Date(),
    onChange: (date: Date) => console.log("Selected:", date),
  },
};

function ControlledDatePicker() {
  const [date, setDate] = useState<Date | null>(new Date());
  return (
    <div>
      <DatePicker value={date} onChange={setDate} />
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
        Selected: {date ? date.toLocaleDateString() : "None"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDatePicker />,
};
