import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export type DataTableColumn<Row> = {
  key: string
  header: ReactNode
  render: (row: Row) => ReactNode
  align?: 'start' | 'end'
  width?: string
}

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  caption?: ReactNode
  rowId?: (row: Row) => string | undefined
}

export const DataTable = <Row,>({ columns, rows, rowKey, caption, rowId }: DataTableProps<Row>) => (
  <div className={styles.scroller}>
    <table className={styles.table}>
      {caption ? <caption className={styles.caption}>{caption}</caption> : null}
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              style={column.width ? { width: column.width } : undefined}
              className={column.align === 'end' ? styles.end : undefined}
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
              <td key={column.key} className={column.align === 'end' ? styles.end : undefined}>
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
