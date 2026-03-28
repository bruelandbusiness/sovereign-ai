import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FileUploadDropzone } from "./FileUploadDropzone";

const meta: Meta<typeof FileUploadDropzone> = {
  title: "UI/FileUploadDropzone",
  component: FileUploadDropzone,
  parameters: {
    backgrounds: { default: "dark" },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "2rem", width: "480px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileUploadDropzone>;

export const Default: Story = {
  args: {
    onFilesSelected: (files) => console.log("Files selected:", files),
  },
};

export const ImageOnly: Story = {
  args: {
    accept: "image/*",
    onFilesSelected: (files) => console.log("Images selected:", files),
  },
};

export const SingleFile: Story = {
  args: {
    multiple: false,
    onFilesSelected: (files) => console.log("File selected:", files),
  },
};
