import styles from './States.module.css'

export function UnsupportedARState({ label }: { label: string }) {
  return (
    <p className={styles.unsupported} role="status">
      {label}
    </p>
  )
}
