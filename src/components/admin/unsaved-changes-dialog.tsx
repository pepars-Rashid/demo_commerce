"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnsavedChangesDialogProps {
  open: boolean;
  /** Called when the user chooses to stay or dismisses */
  onStay: () => void;
  /** Called when the user confirms leaving */
  onExit: () => void;
  /** Override the title (defaults to "تغييرات غير محفوظة") */
  title?: string;
  /** Override the description */
  description?: string;
  /** Override the "stay" button label (defaults to "متابعة التحرير") */
  stayLabel?: string;
  /** Override the "exit" button label (defaults to "خروج بدون حفظ") */
  exitLabel?: string;
}

const defaults = {
  title: "تغييرات غير محفوظة",
  description:
    "لديك تغييرات لم يتم حفظها بعد. إذا خرجت الآن سيتم فقدان هذه\n" +
    "التغييرات.",
  stayLabel: "متابعة التحرير",
  exitLabel: "خروج بدون حفظ",
};

export function UnsavedChangesDialog({
  open,
  onStay,
  onExit,
  title,
  description,
  stayLabel,
  exitLabel,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onStay()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title ?? defaults.title}</DialogTitle>
          <DialogDescription>
            {description ?? defaults.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onStay}>
            {stayLabel ?? defaults.stayLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onExit}>
            {exitLabel ?? defaults.exitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}