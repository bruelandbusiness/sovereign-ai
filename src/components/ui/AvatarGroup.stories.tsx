import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AvatarGroup } from "@/components/ui/AvatarGroup";

const meta: Meta<typeof AvatarGroup> = {
  title: "UI/AvatarGroup",
  component: AvatarGroup,
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {
  args: {
    avatars: [
      { name: "Alice Chen" },
      { name: "Bob Martin" },
      { name: "Carol White" },
      { name: "Dan Lee" },
      { name: "Eve Garcia" },
    ],
  },
};

export const WithOverflow: Story = {
  args: {
    max: 4,
    avatars: [
      { name: "Alice Chen" },
      { name: "Bob Martin" },
      { name: "Carol White" },
      { name: "Dan Lee" },
      { name: "Eve Garcia" },
      { name: "Frank Hill" },
      { name: "Grace Kim" },
      { name: "Hank Patel" },
    ],
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>Small</p>
        <AvatarGroup
          size="sm"
          avatars={[
            { name: "Alice Chen" },
            { name: "Bob Martin" },
            { name: "Carol White" },
          ]}
        />
      </div>
      <div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>Medium</p>
        <AvatarGroup
          size="md"
          avatars={[
            { name: "Alice Chen" },
            { name: "Bob Martin" },
            { name: "Carol White" },
          ]}
        />
      </div>
      <div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>Large</p>
        <AvatarGroup
          size="lg"
          avatars={[
            { name: "Alice Chen" },
            { name: "Bob Martin" },
            { name: "Carol White" },
          ]}
        />
      </div>
    </div>
  ),
};
