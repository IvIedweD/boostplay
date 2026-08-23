import { useEffect, useRef, type ReactNode } from 'react';

export function BoostplayDialog({
  title,
  eyebrow,
  children,
  actions,
  onClose,
  className = '',
  bodyClassName = '',
  titleAlign = 'left',
  dismissible = true,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  className?: string;
  bodyClassName?: string;
  titleAlign?: 'left' | 'center';
  dismissible?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute('disabled'));
    dialog?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (document.activeElement === dialog) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [dismissible, onClose]);

  return (
    <div className="bp-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (dismissible && event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className={`bp-dialog ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby="bp-dialog-title" tabIndex={-1}>
        {dismissible && <button type="button" className="bp-dialog__close" aria-label="Закрыть окно" onClick={onClose}>×</button>}
        <div className={`bp-dialog__heading is-${titleAlign}`}>
          {eyebrow && <span className="bp-eyebrow">{eyebrow}</span>}
          <h2 id="bp-dialog-title">{title}</h2>
        </div>
        <div className={`bp-dialog__body ${bodyClassName}`.trim()}>{children}</div>
        {actions && <div className="bp-dialog__actions">{actions}</div>}
      </div>
    </div>
  );
}
