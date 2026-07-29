import { localAssets } from '../data/assets'
import styles from './BetaRealFooter.module.css'

export function BetaRealFooter({ line }: { line: string }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <img src={localAssets.logos.white} width="128" height="33" alt="BetaReal" />
        <p>{line}</p>
        <div>
          <a href="mailto:betareal.ar@gmail.com">betareal.ar@gmail.com</a>
          <a href="tel:+995593191707">+995 593 19 17 07</a>
        </div>
      </div>
    </footer>
  )
}
