import { localAssets } from '../data/assets'
import styles from './BetaRealFooter.module.css'

export function BetaRealFooter({ line }: { line: string }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <img src={localAssets.logos.official} width="1768" height="628" alt="BetaReal" data-testid="brand-logo-footer" />
        <p>{line}</p>
        <div>
          <a href="mailto:betareal.ar@gmail.com">betareal.ar@gmail.com</a>
          <a href="tel:+995593191707">+995 593 19 17 07</a>
        </div>
      </div>
    </footer>
  )
}
