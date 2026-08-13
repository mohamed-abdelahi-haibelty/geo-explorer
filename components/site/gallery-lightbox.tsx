"use client";

import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import type { LocaleCode } from "@/lib/validation/locale";

export type LightboxImage = { publicId: string; blurDataUrl: string | null; alt: string; caption?: string };

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Base UI's Dialog primitive supplies Escape-to-close for free, and its own
// focus guards are meant to trap Tab — but with several <Dialog.Trigger>
// thumbnails feeding one <Dialog.Root>, that guard-based trap measurably
// leaked focus into the page header (verified with a Playwright Tab-sequence
// test: focus walked out to nav links instead of cycling Close/Prev/Next).
// This is a small, self-contained manual trap layered on top as the
// reliable path, rather than a fix that depends on fully explaining a
// third-party focus-guard's internals.
function trapTabKey(event: React.KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== "Tab" || !container) return;
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last || !container.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

// Base UI's Dialog primitive supplies the modal backdrop and Escape-to-close
// for free (same primitive components/ui/dialog.tsx and mobile-nav.tsx's
// Sheet already build on) — this adds the full-bleed viewer chrome,
// arrow-key prev/next, and the manual Tab trap above, making the lightbox
// keyboard-operable with a focus trap.
export function GalleryLightbox({
  images,
  locale,
  labels,
}: {
  images: LightboxImage[];
  locale: LocaleCode;
  labels: { close: string; previous: string; next: string; openImage: string };
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const total = images.length;

  function show(index: number) {
    setOpenIndex(((index % total) + total) % total);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (total > 1 && openIndex !== null) {
      const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const backwardKey = isRtl ? "ArrowRight" : "ArrowLeft";
      if (event.key === forwardKey) show(openIndex + 1);
      if (event.key === backwardKey) show(openIndex - 1);
    }
    trapTabKey(event, popupRef.current);
  }

  const active = openIndex !== null ? images[openIndex] : null;

  return (
    // Every trigger and the popup share one <Dialog.Root> — Base UI's
    // FloatingFocusManager (which does the actual trapping, verified by
    // reading node_modules/@base-ui/react/dialog/popup/DialogPopup.js) needs
    // a real <Dialog.Trigger> registered against the same root to compute
    // its floating reference/return-focus target; a plain onClick button
    // driving `open` from the outside left the trap inert (confirmed via a
    // Playwright Tab-sequence test: focus walked straight out into the page
    // header). Each thumbnail is its own trigger; the shared `open` state
    // still comes from Dialog.Root's own controlled `open` prop, so only
    // `onClick` needs to also set which index opens.
    <Dialog.Root open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <li key={`${image.publicId}-${index}`}>
            <Dialog.Trigger
              onClick={() => setOpenIndex(index)}
              aria-label={labels.openImage}
              className="relative block aspect-4/3 w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CldImage publicId={image.publicId} alt={image.alt} fill sizes="(min-width: 640px) 33vw, 50vw" blurDataUrl={image.blurDataUrl} />
            </Dialog.Trigger>
          </li>
        ))}
      </ul>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/90 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup
          ref={popupRef}
          onKeyDown={handleKeyDown}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 outline-none sm:p-10"
        >
          <Dialog.Title className="sr-only">{active?.alt || labels.openImage}</Dialog.Title>

          {active && (
            <>
              <div className="relative max-h-[70vh] w-full max-w-4xl flex-1">
                <CldImage publicId={active.publicId} alt={active.alt} fill sizes="100vw" className="object-contain" />
              </div>
              {active.caption && <p className="max-w-2xl text-center text-sm text-white/85">{active.caption}</p>}
              {total > 1 && (
                <p className="font-mono text-xs text-white/60 tabular-nums">
                  {(openIndex ?? 0) + 1} / {total}
                </p>
              )}
            </>
          )}

          <Dialog.Close
            aria-label={labels.close}
            className="absolute end-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X aria-hidden="true" className="size-5" />
          </Dialog.Close>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => show((openIndex ?? 0) - 1)}
                aria-label={labels.previous}
                className="absolute start-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <PrevIcon aria-hidden="true" className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => show((openIndex ?? 0) + 1)}
                aria-label={labels.next}
                className="absolute end-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <NextIcon aria-hidden="true" className="size-5" />
              </button>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
