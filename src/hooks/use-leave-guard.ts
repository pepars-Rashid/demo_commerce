"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Guards against leaving the page when there are unsaved changes.
 *
 * - `isDirty` (from React Hook Form or any source) controls arming.
 * - Browser **Back button**: while dirty a sentinel history entry sits on top
 *   of the current URL, so a Back press pops the sentinel (keeps the sheet /
 *   page mounted) and we show the modal. On confirm/exit the stored
 *   navigation runs; on stay we re-push the sentinel.
 * - Programmatic exit (cancel button, sheet-close, overlay click): wrap the
 *   navigate fn in `guard()`; it navigates immediately when clean or shows
 *   the modal first when dirty.
 *
 * The caller must render `<UnsavedChangesDialog>` with the returned state.
 */
export function useLeaveGuard(isDirty: boolean) {
  const [showModal, setShowModal] = useState(false);
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  // Ref mirrors isDirty synchronously so closures see the latest value.
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Tracks whether a sentinel entry is currently on top of the history.
  const sentinelRef = useRef(false);

  // ─── Arm / disarm: sentinel + listeners while dirty ────────────────────
  useEffect(() => {
    if (!isDirty) return;

    // Push a sentinel on top of the current URL so a Browser Back pops it
    // while keeping the sheet/page mounted (URL unchanged) for us to show
    // the dialog instead of losing the changes to unmount.
    window.history.pushState(null, "", window.location.href);
    sentinelRef.current = true;

    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      // The back popped our sentinel; URL is unchanged so the sheet/page is
      // still mounted. Remember we need to back() once more to really leave.
      sentinelRef.current = false;
      setOnConfirm(() => () => window.history.back());
      setShowModal(true);
      // NOTE: do not re-push here — staying re-pushes on cancel().
    };
    window.addEventListener("popstate", handlePopState);

    // Native browser dialog for tab close / refresh.
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // ─── Programmatic navigation interception ─────────────────────────────
  /**
   * Call before navigating (e.g. cancel button, sheet close). If the form
   * is dirty the modal appears; if clean, navigates immediately.
   */
  const guard = useCallback((navigate: () => void) => {
    if (!isDirtyRef.current) {
      navigate();
      return;
    }
    setOnConfirm(() => navigate);
    setShowModal(true);
  }, []);

  /**
   * Synchronously mark the guard as disarmed (isDirtyRef → false).
   * Call before navigating (on save or on a discarded-exit confirm) so the
   * popstate the navigation itself fires is ignored instead of reopening the
   * modal.
   */
  const disarm = useCallback(() => {
    isDirtyRef.current = false;
  }, []);

  // ─── Modal actions ─────────────────────────────────────────────────────
  /** User chose to stay — hide the dialog and restore the sentinel. */
  const cancel = useCallback(() => {
    setShowModal(false);
    setOnConfirm(null);
    if (!sentinelRef.current) {
      window.history.pushState(null, "", window.location.href);
      sentinelRef.current = true;
    }
  }, []);

  /** User confirmed leaving — disarm then run the stored navigation. */
  const confirm = useCallback(() => {
    // Disarm FIRST so the popstate triggered by the navigation below is
    // ignored rather than reopening the modal in a loop.
    isDirtyRef.current = false;
    const fn = onConfirm;
    setShowModal(false);
    setOnConfirm(null);
    fn?.();
  }, [onConfirm]);

  return { showModal, guard, cancel, confirm, disarm };
}
