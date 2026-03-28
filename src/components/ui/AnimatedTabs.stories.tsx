import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";

const meta: Meta<typeof AnimatedTabs> = {
  title: "UI/AnimatedTabs",
  component: AnimatedTabs,
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", padding: 32, minHeight: 300 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AnimatedTabs>;

export const Default: Story = {
  args: {
    items: [
      {
        value: "overview",
        label: "Overview",
        content: (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <h3 style={{ color: "white", marginBottom: 8 }}>Overview</h3>
            <p>High-level metrics and summary of your account performance.</p>
          </div>
        ),
      },
      {
        value: "analytics",
        label: "Analytics",
        content: (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <h3 style={{ color: "white", marginBottom: 8 }}>Analytics</h3>
            <p>Detailed charts and breakdowns of traffic, conversions, and revenue.</p>
          </div>
        ),
      },
      {
        value: "settings",
        label: "Settings",
        content: (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <h3 style={{ color: "white", marginBottom: 8 }}>Settings</h3>
            <p>Configure notifications, integrations, and account preferences.</p>
          </div>
        ),
      },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      {
        value: "overview",
        label: "Overview",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
        content: (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <p>Overview dashboard with key metrics at a glance.</p>
          </div>
        ),
      },
      {
        value: "analytics",
        label: "Analytics",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
        content: (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <p>In-depth analytics with filtering and export options.</p>
          </div>
        ),
      },
      {
        value: "settings",
        label: "Settings",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
        content: (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <p>Manage your account settings and preferences.</p>
          </div>
        ),
      },
    ],
  },
};
