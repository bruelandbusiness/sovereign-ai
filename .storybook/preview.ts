import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "sovereign-dark",
      values: [
        { name: "sovereign-dark", value: "#0a0a0f" },
        { name: "sovereign-card", value: "#101018" },
      ],
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          backgroundColor: "#0a0a0f",
          color: "#ececef",
          padding: "2rem",
          minHeight: "100vh",
          fontFamily: "DM Sans, system-ui, sans-serif",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
