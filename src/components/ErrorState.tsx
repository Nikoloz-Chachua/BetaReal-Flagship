import styles from './States.module.css'

export function ErrorState({ label }: { label: string }) {
  return (
    <div className={styles.state} role="alert">
      <span>{label}</span>
    </div>
  )
}
