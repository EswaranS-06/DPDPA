import {
  KB_PATH,
  KB_SECTION_LABEL,
  KB_SECTIONS,
  kbHref,
  type KbSection,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import styles from './KbBar.module.css'

type KbBarProps = {
  /** The open section; undefined while showing search results. */
  section?: KbSection
  query?: string
}

/** Search box and section tabs at the top of the knowledge-base page. */
export const KbBar = ({ section, query }: KbBarProps) => (
  <div className={styles.bar}>
    <form method="get" action={KB_PATH} role="search" className={styles.search}>
      <label htmlFor="kb-search" className="visually-hidden">
        Search the knowledge base
      </label>
      <input
        id="kb-search"
        name="q"
        type="search"
        defaultValue={query ?? ''}
        placeholder="Citation, code or words: s.8(6), Rule 7, OBL-CON-01, C1.5, withdrawal"
      />
      <button type="submit">Search</button>
    </form>
    <nav aria-label="Knowledge base sections">
      <ul className={styles.tabs}>
        {KB_SECTIONS.map((name) => (
          <li key={name}>
            <Link
              href={kbHref(name)}
              className={name === section ? `${styles.tab} ${styles.current}` : styles.tab}
              aria-current={name === section ? 'page' : undefined}
            >
              {KB_SECTION_LABEL[name]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </div>
)
