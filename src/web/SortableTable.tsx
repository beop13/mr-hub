import { useMemo, useState, type ReactNode } from 'react'

export type SortValue = string | number | null

export type Column<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => SortValue
  className?: string
}

type Sort = { id: string; dir: 1 | -1 }

function compare(a: SortValue, b: SortValue): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a < b ? -1 : 1
}

export function SortableTable<T>(props: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  initialSort?: Sort
  empty?: string
}) {
  const [sort, setSort] = useState<Sort | undefined>(props.initialSort)

  const sorted = useMemo(() => {
    const column = props.columns.find((c) => c.id === sort?.id)
    if (!sort || !column?.sortValue) return props.rows
    const value = column.sortValue
    return [...props.rows].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      if (va === null || vb === null) return compare(va, vb)
      return compare(va, vb) * sort.dir
    })
  }, [props.rows, props.columns, sort])

  const toggle = (id: string) =>
    setSort((s) => (s?.id === id ? { id, dir: s.dir === 1 ? -1 : 1 } : { id, dir: 1 }))

  if (props.rows.length === 0) return <p className="empty">{props.empty ?? 'Пусто'}</p>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {props.columns.map((c) => (
              <th
                key={c.id}
                className={[c.className, c.sortValue ? 'sortable' : ''].join(' ')}
                onClick={c.sortValue ? () => toggle(c.id) : undefined}
                aria-sort={sort?.id === c.id ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
              >
                {c.header}
                {sort?.id === c.id ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={props.rowKey(row)}>
              {props.columns.map((c) => (
                <td key={c.id} className={c.className}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
