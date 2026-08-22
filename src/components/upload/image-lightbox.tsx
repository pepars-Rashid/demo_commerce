"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
  onDelete?: () => void;
}

export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt,
  onDelete,
}: ImageLightboxProps) {
  // Close on Escape key. Registered in CAPTURE phase so it runs BEFORE Radix's
  // document-level Escape handler, and stopPropagation prevents the Dialog
  // beneath this lightbox from also closing.
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label={alt ?? "معاينة الصورة"}
    >
      {/* Close button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute end-4 top-4 z-10 text-white hover:bg-white/10 hover:text-white"
        onClick={() => onOpenChange(false)}
        aria-label="إغلاق"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Delete button (optional) */}
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute start-4 top-4 z-10 text-white hover:bg-white/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="حذف الصورة"
        >
          <Trash2 className="h-6 w-6" />
        </Button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? "معاينة الصورة"}
        className="max-h-[85vh] max-w-[90vw] rounded-md object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}