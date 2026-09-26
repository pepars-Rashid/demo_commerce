"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inventoryLogSchema } from "@/lib/zod/inventory";
import type { InventoryLogFormValues } from "@/lib/zod/inventory";
import { createInventoryLog } from "@/lib/actions/inventory";

const DIRECTION_OPTIONS: { value: "in" | "out"; label: string }[] = [
  { value: "in", label: "إضافة (زيادة المخزون)" },
  { value: "out", label: "خصم (نقصان المخزون)" },
];

interface InventoryLogNewFormProps {
  onDone?: () => void;
}

export function InventoryLogNewForm({ onDone }: InventoryLogNewFormProps) {
  const router = useRouter();

  // Whether this entry should also mutate the product's physical stock. Default
  // ON — applying the stock effect is the primary (intended) action.
  const [applyToStock, setApplyToStock] = useState(true);
  // Only shown when the entry would mutate stock (a consequential action).
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<InventoryLogFormValues>({
    resolver: zodResolver(inventoryLogSchema) as Resolver<InventoryLogFormValues>,
    defaultValues: {
      sku: "",
      direction: "in",
      amount: 1,
      reason: "",
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const direction = useWatch({ control, name: "direction" });

  async function save(data: InventoryLogFormValues, stock: boolean) {
    try {
      await createInventoryLog(data, { applyToStock: stock });
      toast.success("تمت إضافة السجل بنجاح");
      onDone?.();
      router.push("/profile/admin/inventory");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ");
    }
  }

  function onSubmit(data: InventoryLogFormValues) {
    // Stock-affecting entries ask for confirmation first; log-only entries submit
    // straight away (non-consequential).
    if (applyToStock) {
      setConfirmOpen(true);
    } else {
      void save(data, false);
    }
  }

  function onConfirmApply() {
    setConfirmOpen(false);
    // The dialog only opens after a validated submit, so the current values are valid.
    void save(form.getValues(), true);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
      {/* SKU */}
      <Field>
        <FieldLabel htmlFor="sku">رمز SKU</FieldLabel>
        <FieldContent>
          <Input
            id="sku"
            type="text"
            dir="ltr"
            {...register("sku")}
            disabled={isSubmitting}
            placeholder="مثال: womens-dresses-31-1-2"
            aria-invalid={!!errors.sku}
          />
          <FieldError errors={errors.sku ? [errors.sku] : undefined} />
        </FieldContent>
      </Field>

      {/* Direction + amount */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>الوجهة</FieldLabel>
          <FieldContent>
            <Select
              value={direction}
              onValueChange={(value) =>
                form.setValue("direction", value as "in" | "out", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger aria-label="اتجاه التغيير">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIRECTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={errors.direction ? [errors.direction] : undefined}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="amount">الكمية</FieldLabel>
          <FieldContent>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              {...register("amount")}
              disabled={isSubmitting}
              aria-invalid={!!errors.amount}
            />
            <FieldError errors={errors.amount ? [errors.amount] : undefined} />
          </FieldContent>
        </Field>
      </div>

      {/* Reason */}
      <Field>
        <FieldLabel htmlFor="reason">السبب</FieldLabel>
        <FieldContent>
          <Textarea
            id="reason"
            {...register("reason")}
            disabled={isSubmitting}
            placeholder="مثال: جرد يدوي، مرتجعات، تالف..."
            rows={3}
            aria-invalid={!!errors.reason}
          />
          <FieldError errors={errors.reason ? [errors.reason] : undefined} />
        </FieldContent>
      </Field>

      {/* Apply to stock toggle */}
      <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">تطبيق التغيير على مخزون المنتج الفعلي</p>
          <p className="text-xs text-muted-foreground">
            عند التفعيل، يتم تحديث الكمية الفعلية للمنتج وتُسجَّل في هذه الحركة.
          </p>
        </div>
        <Switch
          checked={applyToStock}
          onCheckedChange={setApplyToStock}
          aria-label="تطبيق التغيير على المخزون"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            "حفظ السجل"
          )}
        </Button>
      </div>
      </form>

      <Dialog open={confirmOpen} onOpenChange={(next) => !next && setConfirmOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد تطبيق التغيير على المخزون</DialogTitle>
            <DialogDescription>
              سيتم تعديل الكمية الفعلية للمنتج وفق هذا السجل ولا يمكن التراجع عنه بسهولة.
              هل تريد المتابعة؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              إلغاء
            </Button>
            <Button type="button" onClick={onConfirmApply} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              نعم، تطبيق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}