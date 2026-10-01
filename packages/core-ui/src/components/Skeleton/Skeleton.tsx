import styles from './Skeleton.module.css'

type SkeletonProps = {
  /** Width as a CSS length or percentage. */
  width?: string
  height?: string
  /** "block" for tiles and charts; "text" for a line of text. */
  shape?: 'text' | 'block'
}

/** A grey placeholder in the shape of content that is still loading. */
export const Skeleton = ({ width = '100%', height, shape = 'text' }: SkeletonProps) => (
  <span
    className={shape === 'block' ? `${styles.skeleton} ${styles.block}` : styles.skeleton}
    style={{ width, height }}
    aria-hidden="true"
  />
)

/** The loading shape of a page: a title, a row of tiles and a table. Announced once. */
export const PageSkeleton = ({ label = 'Loading' }: { label?: string }) => (
  <div className={styles.page} role="status" aria-live="polite">
    <span className="visually-hidden">{label}…</span>
    <Skeleton width="16rem" height="1.75rem" />
    <Skeleton width="28rem" />
    <div className={styles.tiles}>
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} shape="block" height="6.5rem" />
      ))}
    </div>
    <Skeleton shape="block" height="14rem" />
    <div className={styles.rows}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton key={index} width={`${92 - index * 9}%`} />
      ))}
    </div>
  </div>
)
