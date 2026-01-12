import type { ReactNode } from "react";

export interface Column<T> {
  readonly header: string;
  readonly accessor: keyof T | ((row: T) => ReactNode);
  readonly className?: string;
}

export interface DataTableProps<T> {
  readonly columns: readonly Column<T>[];
  readonly data: readonly T[];
  readonly getRowKey: (row: T) => string;
  readonly emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const renderCell = (column: Column<T>, row: T): ReactNode => {
    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }
    const value = row[column.accessor];
    return value == null ? "-" : String(value);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.className || ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-gray-50">
              {columns.map((column, columnIndex) => (
                <td
                  key={column.header}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    columnIndex === 0
                      ? "font-medium text-gray-900"
                      : "text-gray-500"
                  } ${column.className || ""}`}
                >
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

