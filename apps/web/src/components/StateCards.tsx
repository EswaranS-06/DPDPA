'use client'

import { CircleAlert, RotateCw, SearchX } from 'lucide-react'
import Link from 'next/link'
import styles from './StateCards.module.css'

/** A failure says what happened, what to try and the error ID to quote to the administrator. */
export const ErrorCard = ({ digest, reset }: { digest?: string; reset: () => void }) => (
  <section className={styles.card} role="alert" aria-labelledby="error-title">
    <span className={`${styles.icon} ${styles.danger}`} aria-hidden="true">
      <CircleAlert size={22} strokeWidth={1.75} />
    </span>
    <h1 id="error-title" className={styles.title}>
      This page could not be loaded
    </h1>
    <p className={styles.text}>
      The server could not finish the request, so nothing you entered was saved. Try again. If it
      keeps happening, the database or the sign-in service may be down.
    </p>
    {digest ? (
      <p className={styles.id}>
        Error ID <span className="code">{digest}</span>. Quote it to your DUATF administrator: it
        points to the entry in the server log.
      </p>
    ) : null}
    <div className={styles.actions}>
      <button type="button" onClick={reset} className={styles.button}>
        <RotateCw size={16} aria-hidden="true" />
        Try again
      </button>
      {/* A plain link on purpose: a full reload recovers from a broken page state. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={styles.secondary}>
        Go to the overview
      </a>
    </div>
  </section>
)

/** Not found, without saying whether the record exists for another client. */
export const NotFoundCard = () => (
  <section className={styles.card} aria-labelledby="not-found-title">
    <span className={styles.icon} aria-hidden="true">
      <SearchX size={22} strokeWidth={1.75} />
    </span>
    <h1 id="not-found-title" className={styles.title}>
      Page not found
    </h1>
    <p className={styles.text}>
      This address does not exist, or it belongs to a client you do not have access to. DUATF does
      not say which, so that other clients&apos; records stay private.
    </p>
    <div className={styles.actions}>
      <Link href="/" className={styles.button}>
        Go to your home page
      </Link>
      <Link href="/search" className={styles.secondary}>
        Search
      </Link>
    </div>
  </section>
)
