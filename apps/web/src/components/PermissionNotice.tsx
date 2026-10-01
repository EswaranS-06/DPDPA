import type { Denial } from '@duatf/core-access'
import { buttonClass, DescriptionList } from '@duatf/core-ui'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import styles from './PermissionNotice.module.css'

/** A refusal explained: what was refused, the reader's role, who can do it and whom to ask. */
export const PermissionNotice = ({
  denial,
  back,
}: {
  denial: Denial
  back: { href: string; label: string }
}) => (
  <section className={styles.notice} aria-labelledby="permission-title">
    <span className={styles.icon} aria-hidden="true">
      <Lock size={20} strokeWidth={1.75} />
    </span>
    <div className={styles.body}>
      <h1 id="permission-title" className={styles.title}>
        You don&apos;t have permission to {denial.action}
      </h1>
      <DescriptionList
        columns={2}
        items={[
          {
            label: 'Your role here',
            value: denial.yourRoles.length ? denial.yourRoles.join(', ') : 'No role',
          },
          { label: 'Who can', value: denial.allowedRoles.join(', ') },
        ]}
      />
      <p className={styles.help}>
        {denial.otherDepartment
          ? 'Your role covers a different department. Ask the client DPO to assign the work to your department, or to do it themselves.'
          : `Ask ${denial.ask} if you need this.`}
      </p>
      <div>
        <Link href={back.href} className={buttonClass('secondary')}>
          {back.label}
        </Link>
      </div>
    </div>
  </section>
)
