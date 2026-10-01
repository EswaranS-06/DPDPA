import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export type DataTableColumn<Row> = {
  key: string
  header: ReactNode
  /** The column name shown beside each value when rows stack on a phone; defaults to a text header. */
  label?: string
  render: (row: Row) => ReactNode
  align?: 'start' | 'end'
  width?: string
  /** Hidden on narrow screens when the row has enough without it. */
  priority?: 'low'
}

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  caption?: ReactNode
  rowId?: (row: Row) => string | undefined
  /** Rows become cards on phones (default); "scroll" keeps the grid and scrolls sideways. */
  mobile?: 'stack' | 'scroll'
  /** No outer border, for a table that sits inside a panel. */
  plain?: boolean
}

/** A bordered table: quiet header, hairline rows, numbers aligned right in tabular figures. */
export const DataTable = <Row,>({
  columns,
  rows,
  rowKey,
  caption,
  rowId,
  mobile = 'stack',
  plain = false,
}: DataTableProps<Row>) => (
  <div
    className={[styles.scroller, mobile === 'stack' ? styles.stack : '', plain ? styles.plain : '']
      .filter(Boolean)
      .join(' ')}
  >
    <table className={styles.table}>
      {caption ? <caption className={styles.caption}>{caption}</caption> : null}
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              style={column.width ? { width: column.width } : undefined}
              className={cellClass(column)}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} id={rowId?.(row)}>
            {columns.map((column) => (
              <td
                key={column.key}
                className={cellClass(column)}
                data-label={
                  column.label ?? (typeof column.header === 'string' ? column.header : '')
                }
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const cellClass = <Row,>(column: DataTableColumn<Row>) =>
  [column.align === 'end' ? styles.end : '', column.priority === 'low' ? styles.low : '']
    .filter(Boolean)
    .join(' ') || undefined
