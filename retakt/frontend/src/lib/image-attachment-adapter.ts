import type {
  AttachmentAdapter,
  PendingAttachment,
  CompleteAttachment,
} from "@assistant-ui/react";

/**
 * Attachment adapter for handling image uploads in the chat interface.
 * Converts images to base64 data URLs for display and API transmission.
 */
export class ImageAttachmentAdapter implements AttachmentAdapter {
  accept = "image/*";

  async add({ file }: { file: File }): Promise<PendingAttachment> {
    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("Image size exceeds 20MB limit");
    }

    return {
      id: crypto.randomUUID(),
      type: "image",
      name: file.name,
      contentType: file.type,
      file,
      status: { type: "requires-action", reason: "composer-send" },
    };
  }

  async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    // Convert image to base64 data URL
    const base64 = await this.fileToBase64DataURL(attachment.file);

    // Return in assistant-ui format with image content
    return {
      id: attachment.id,
      type: "image",
      name: attachment.name,
      contentType: attachment.contentType,
      content: [
        {
          type: "image",
          image: base64, // data:image/jpeg;base64,... format
        },
      ],
      status: { type: "complete" },
    };
  }

  async remove(attachment: PendingAttachment): Promise<void> {
    // Cleanup if needed (e.g., revoke object URLs)
  }

  private async fileToBase64DataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // FileReader result is already a data URL
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
