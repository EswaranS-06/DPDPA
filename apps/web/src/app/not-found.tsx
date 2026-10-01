import { NotFoundCard } from '@/components/StateCards'
import styles from './states.module.css'

export default function NotFound() {
  return (
    <main id="main" className={styles.page}>
      <NotFoundCard />
    </main>
  )
}
