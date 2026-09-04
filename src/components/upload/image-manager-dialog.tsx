"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Expand, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  /** When true (single-image slot), a newly uploaded image replaces the existing one */
  replaceMode?: boolean;
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
  registerCloseGuard,
  replaceMode = false,
}: {
  onSave: (images: string[]) => void;
  onOpenChange: (open: boolean) => void;
  initialImages: string[];
  maxFiles: number;
  maxSizeMB: number;
  readOnly?: boolean;
  registerCloseGuard: (fn: () => void) => void;
  replaceMode?: boolean;
}) {
  const { fileStates, isUploading, resetFiles, uploadFiles } = useUploader();
  const [savedImages, setSavedImages] =
    React.useState<string[]>(initialImages);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [confirmExitOpen, setConfirmExitOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Remaining slots = total limit − already-saved images − files queued for upload.
  // In replaceMode the existing image doesn't consume a slot — a new upload
  // is meant to replace it.
  const remainingSlots = Math.max(
    0,
    maxFiles -
      (replaceMode ? 0 : savedImages.length) -
      fileStates.length,
  );

  // Dirty = there are queued/unsaved uploads OR the user deleted a saved image
  const isDirty =
    fileStates.length > 0 ||
    savedImages.length !== initialImages.length ||
    savedImages.some((url, i) => url !== initialImages[i]);

  // Intercept close requests: warn about unsaved changes instead of closing directly
  function requestClose() {
    if (isDirty || isUploading) {
      setConfirmExitOpen(true);
    } else {
      onOpenChange(false);
    }
  }

  // Register the guarded close so the outer dialog (ESC / overlay click)
  // also goes through the unsaved-changes check.
  React.useEffect(() => {
    registerCloseGuard(requestClose);
  });

  // Deferred upload: nothing hits storage until the user clicks save
  async function handleSave() {
    setIsSaving(true);
    try {
      const results = await uploadFiles();
      const uploadedUrls = results
        .map((r) => r.url)
        .filter((url): url is string => Boolean(url));

      const failedCount = results.filter((r) => !r.url).length;
      if (failedCount > 0 && uploadedUrls.length === 0) {
        toast.error("فشل رفع الصور، حاول مرة أخرى");
        return;
      }
      if (failedCount > 0) {
        toast.error(`فشل رفع ${failedCount} من الصور — تم حفظ الباقي`);
      }

      // In replaceMode the newest upload wins over the existing image.
      const finalImages = replaceMode
        ? [...uploadedUrls, ...savedImages]
        : [...savedImages, ...uploadedUrls];
      onSave(finalImages);
    } catch {
      toast.error("حدث خطأ أثناء رفع الصور");
    } finally {
      setIsSaving(false);
    }
  }

  function handleExitWithoutSaving() {
    setConfirmExitOpen(false);
    resetFiles();
    onOpenChange(false);
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <>
          <ImageDropzone
            dropzoneOptions={{
              maxFiles: Math.max(1, remainingSlots),
              maxSize: maxSizeMB * 1024 * 1024,
            }}
            disabled={remainingSlots <= 0 || isSaving}
          />
          <p className="text-xs text-muted-foreground">
            {remainingSlots > 0
              ? `يمكنك إضافة ${remainingSlots} ${
                  remainingSlots === 1 ? "صورة أخرى" : "صور أخرى"
                }`
              : "تم الوصول للحد الأقصى من الصور"}
          </p>
        </>
      )}

      {/* Saved images (from DB) */}
      {savedImages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {savedImages.map((url, i) => (
            <div
              key={url}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted"
            >
              <Image
                fill
                src={url}
                alt={`صورة ${i + 1}`}
                className="object-cover cursor-pointer"
                sizes="80px"
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
                  {/* Delete button (desktop hover only — hidden on mobile to avoid ghost deletes) */}
                  <button
                    type="button"
                    className="absolute end-1 top-1 z-10 max-sm:hidden rounded-full border border-muted-foreground bg-background p-1 shadow-md opacity-0 transition-all hover:scale-110 focus-visible:opacity-100 group-hover:opacity-100"
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
      {!readOnly && <ImageList disabled={isSaving} />}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={requestClose}>
          إلغاء
        </Button>
        {!readOnly && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={isUploading || isSaving}
          >
            {(isUploading || isSaving) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {isUploading || isSaving ? "جاري الرفع..." : "حفظ التغييرات"}
          </Button>
        )}
      </DialogFooter>

      {/* Unsaved-changes confirmation */}
      <Dialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تغييرات غير محفوظة</DialogTitle>
            <DialogDescription>
              لديك صور لم يتم حفظها بعد. إذا خرجت الآن سيتم فقدان هذه التغييرات.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmExitOpen(false)}
            >
              متابعة التحرير
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleExitWithoutSaving}
            >
              خروج بدون حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  replaceMode = false,
  title = "إدارة الصور",
  description,
}: ImageManagerDialogProps) {
  const pathname = usePathname();
  const closeGuardRef = React.useRef<() => void>(() => onOpenChange(false));
  const registerCloseGuard = React.useCallback((fn: () => void) => {
    closeGuardRef.current = fn;
  }, []);

  // If the route changes (e.g. navigating back then re-editing the same
  // product), force the dialog closed so it can't come back "stuck open".
  React.useEffect(() => {
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // ESC / overlay clicks go through the unsaved-changes guard.
        if (!next) {
          closeGuardRef.current();
        } else {
          onOpenChange(true);
        }
      }}
    >
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
          autoUpload={false}
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
            registerCloseGuard={registerCloseGuard}
            replaceMode={replaceMode}
          />
        </UploaderProvider>
      </DialogContent>
    </Dialog>
  );
}