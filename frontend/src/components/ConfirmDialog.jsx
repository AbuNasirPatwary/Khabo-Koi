import { useEffect, useId, useRef } from 'react'


function ConfirmDialog({
  eyebrow = 'Please confirm',
  title,
  description,
  confirmLabel = 'Confirm',
  isSaving = false,
  tone = 'danger',
  onCancel,
  onConfirm,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef(null)
  const confirmButtonRef = useRef(null)
  const isSavingRef = useRef(isSaving)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    isSavingRef.current = isSaving
    onCancelRef.current = onCancel
  }, [isSaving, onCancel])

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement
    confirmButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSavingRef.current) {
        onCancelRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const elements = dialogRef.current?.querySelectorAll('button:not(:disabled)')
      if (!elements?.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedElement?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-5 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">{eyebrow}</p>
        <h2 id={titleId} className="mt-3 text-xl font-bold text-slate-900">{title}</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={isSaving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
          <button ref={confirmButtonRef} type="button" onClick={onConfirm} disabled={isSaving} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
            {isSaving ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}


export default ConfirmDialog
