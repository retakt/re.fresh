"use client";

import { type FC } from "react";
import { MessagePrimitive, useAuiState } from "@assistant-ui/react";
import { Image as ImageIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Component to display images that were sent with user messages.
 * Shows filename by default, image preview on hover.
 */
export const UserMessageImages: FC = () => {
  // Get the message content array
  const content = useAuiState((s) => s.message.content);
  
  // Filter for image parts
  const imageParts = content.filter((part: any) => part.type === "image");
  
  if (imageParts.length === 0) {
    return null;
  }

  return (
    <div className="col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-2 mb-2">
      {imageParts.map((part: any, index: number) => (
        <ImageAttachment 
          key={index} 
          src={part.image} 
          name={`image-${index + 1}.jpg`}
        />
      ))}
    </div>
  );
};

interface ImageAttachmentProps {
  src: string;
  name: string;
}

const ImageAttachment: FC<ImageAttachmentProps> = ({ src, name }) => {
  return (
    <HoverCard openDelay={200}>
      <Dialog>
        <HoverCardTrigger asChild>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              <span>{name}</span>
            </button>
          </DialogTrigger>
        </HoverCardTrigger>

        <HoverCardContent className="w-80" side="top" align="center">
          <div className="space-y-3">
            <div className="aspect-video overflow-hidden rounded-md bg-muted">
              <img
                alt={name}
                className="h-full w-full object-cover"
                src={src}
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">{name}</h4>
              <p className="text-muted-foreground text-xs">Image attachment</p>
            </div>
          </div>
        </HoverCardContent>

        <DialogContent className="p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:bg-foreground/60 [&>button]:p-1 [&>button]:opacity-100 [&>button]:ring-0! [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive">
          <DialogTitle className="sr-only">
            Image Attachment Preview
          </DialogTitle>
          <div className="relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden bg-background">
            <img
              src={src}
              alt={name}
              className="block h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </HoverCard>
  );
};
