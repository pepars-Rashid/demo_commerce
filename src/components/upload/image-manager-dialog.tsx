"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Expand, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploaderProvider, useUploader } from "./uploader-provider";
import { ImageDropzone, ImageList } from "./multi-image";
import { ImageLightbox } from "./image-lightbox";
import { uploadFiles } from "@/lib/utils/uploadthing";

interface ImageManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImages: string[];
  onSave: (images: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  readOnly?: boolean;
  title?: string;
  description?: string;
}

function ImageManagerDialogInner({
  onSave,
  onOpenChange,
  initialImages,
  maxFiles,
  maxSizeMB,
  readOnly = false,
}: {
  onSave: (images: string[]) => void;
  onOpenChange: (open: boolean) => void;
  initialImages: string[];
  maxFiles: number;
  maxSizeMB: number;
  readOnly?: boolean;
}) {
  const { fileStates, isUploading, resetFiles } = useUploader();
  const [savedImages, setSavedImages] =
    React.useState<string[]>(initialImages);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  // Collect completed upload URLs
  const uploadedUrls = React.useMemo(
    () =>
      fileStates
        .filter((fs) => fs.status === "COMPLETE" && !!fs.url)
        .map((fs) => fs.url as string),
    [fileStates],
  );

  function handleSave() {
    onSave([...savedImages, ...uploadedUrls]);
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <ImageDropzone
          dropzoneOptions={{
            maxFiles,
            maxSize: maxSizeMB * 1024 * 1024,
          }}
        />
      )}

      {/* Saved images (from DB) */}
      {savedImages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {savedImages.map((url, i) => (
            <div
              key={url}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`صورة ${i + 1}`}
                className="h-full w-full cursor-pointer object-cover"
                onClick={() => setLightboxUrl(url)}
              />
              {!readOnly && (
                <>
                  {/* Expand button (desktop hover) */}
                  <button
                    type="button"
                    className="absolute start-1 top-1 z-10 rounded-full border border-muted-foreground bg-background p-1 shadow-md opacity-0 transition-all hover:scale-110 focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => setLightboxUrl(url)}
                    aria-label="تكبير الصورة"
                  >
                    <Expand className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {/* Delete button (desktop hover) */}
                  <button
                    type="button"
                    className="absolute end-1 top-1 z-10 rounded-full border border-muted-foreground bg-background p-1 shadow-md opacity-0 transition-all hover:scale-110 focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() =>
                      setSavedImages((prev) => prev.filter((u) => u !== url))
                    }
                    aria-label="حذف الصورة"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox for saved images */}
      {lightboxUrl && (
        <ImageLightbox
          open={!!lightboxUrl}
          onOpenChange={(open) => {
            if (!open) setLightboxUrl(null);
          }}
          src={lightboxUrl}
          alt="معاينة الصورة"
          onDelete={
            readOnly
              ? undefined
              : () => {
                  setSavedImages((prev) =>
                    prev.filter((u) => u !== lightboxUrl),
                  );
                  setLightboxUrl(null);
                }
          }
        />
      )}

      {/* New uploads (progress + delete) */}
      {!readOnly && <ImageList />}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetFiles();
            onOpenChange(false);
          }}
        >
          إلغاء
        </Button>
        {!readOnly && (
          <Button type="button" onClick={handleSave} disabled={isUploading}>
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}

export function ImageManagerDialog({
  open,
  onOpenChange,
  initialImages,
  onSave,
  maxFiles = 5,
  maxSizeMB = 4,
  readOnly = false,
  title = "إدارة الصور",
  description,
}: ImageManagerDialogProps) {
  const pathname = usePathname();

  // If the route changes (e.g. navigating back then re-editing the same
  // product), force the dialog closed so it can't come back "stuck open".
  React.useEffect(() => {
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ??
              (readOnly
                ? "عرض الصور المرفقة."
                : "ارفع الصور أو احذف المرفقة. الحد الأقصى " +
                  maxFiles +
                  " صور، " +
                  maxSizeMB +
                  " م.ب لكل صورة.")}
          </DialogDescription>
        </DialogHeader>

        <UploaderProvider
          uploadFn={async ({ file, signal, onProgressChange }) => {
            const res = await uploadFiles("imageManager", {
              files: [file],
              signal,
              onUploadProgress: ({ progress }) => onProgressChange(progress),
            });
            const url = res?.[0]?.ufsUrl;
            if (!url) throw new Error("فشل رفع الصورة");
            return { url };
          }}
        >
          <ImageManagerDialogInner
            onSave={onSave}
            onOpenChange={onOpenChange}
            initialImages={initialImages}
            maxFiles={maxFiles}
            maxSizeMB={maxSizeMB}
            readOnly={readOnly}
          />
        </UploaderProvider>
      </DialogContent>
    </Dialog>
  );
}