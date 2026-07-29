import { X } from 'lucide-react'
import { useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import styles from './ModalPrimitive.module.css'

interface ModalPrimitiveProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  labelledBy?: string
  closeLabel?: string
}

export function ModalPrimitive({ title, isOpen, onClose, children, labelledBy, closeLabel = 'Close' }: ModalPrimitiveProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(isOpen, dialogRef, onClose)

  if (!isOpen) return null

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.topbar}>
          <p className={styles.title}>{title}</p>
          <button className={styles.close} type="button" onClick={onClose} aria-label={closeLabel}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
