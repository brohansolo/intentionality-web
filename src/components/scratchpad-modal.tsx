"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ScratchpadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScratchpadModal({ open, onOpenChange }: ScratchpadModalProps) {
  const [text, setText] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setText("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scratch Pad</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your notes here..."
          className="min-h-[400px] w-full resize-y"
        />
      </DialogContent>
    </Dialog>
  );
}
