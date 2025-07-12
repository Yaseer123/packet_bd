"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DataTableViewOptions } from "./DataTableViewOptions";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  addButton?: {
    name: string;
    href: string;
  };
  filterBy?: string;
  searchPlaceHolder: string;
  onDragEnd?: (event: DragEndEvent, items: TData[]) => void;
  dragEnabled?: boolean;
  rowIdKey?: keyof TData;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

type DraggableTableRowProps<TData> = {
  row: Row<TData>;
  rowId: string;
  dragHandleCellIndex: number;
};

function DraggableTableRow<TData>({
  row,
  rowId,
  dragHandleCellIndex,
}: DraggableTableRowProps<TData>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  return (
    <TableRow ref={setNodeRef} style={style}>
      {row.getVisibleCells().map((cell, idx) => (
        <TableCell
          key={cell.id}
          className="border-r"
          {...(idx === dragHandleCellIndex
            ? { ...attributes, ...listeners }
            : {})}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<TData>({
  columns,
  data,
  addButton,
  filterBy = "name",
  searchPlaceHolder,
  onDragEnd,
  dragEnabled = false,
  rowIdKey,
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  onLimitChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Find drag handle cell index
  const dragHandleCellIndex = columns.findIndex(
    (col) => col.id === "drag-handle",
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center py-4">
        <Input
          placeholder={searchPlaceHolder}
          value={(table.getColumn(filterBy)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(filterBy)?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DataTableViewOptions table={table} />
        {addButton && (
          <Button asChild variant="default" className="ml-5">
            <Link href={addButton.href}>{addButton.name}</Link>
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="border-r">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              dragEnabled && rowIdKey ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    if (onDragEnd) {
                      onDragEnd(event, data);
                    }
                  }}
                >
                  <SortableContext
                    items={data.map((item) => String(item[rowIdKey]))}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableTableRow<TData>
                        key={row.id}
                        row={row}
                        rowId={String(row.original[rowIdKey])}
                        dragHandleCellIndex={dragHandleCellIndex}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="border-r">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <BackendPagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </div>
  );
}

function BackendPagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex flex-wrap items-center justify-between gap-y-4 px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Showing page {page} of {totalPages} ({total} total products)
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            className="h-8 w-[70px] rounded border px-2"
            value={limit}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
          >
            {[10, 20, 30, 40, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="h-8 w-8 rounded border p-0 disabled:opacity-50"
            onClick={() => onPageChange?.(1)}
            disabled={page === 1}
          >
            «
          </button>
          <button
            className="h-8 w-8 rounded border p-0 disabled:opacity-50"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
          >
            ‹
          </button>
          <button
            className="h-8 w-8 rounded border p-0 disabled:opacity-50"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page === totalPages}
          >
            ›
          </button>
          <button
            className="h-8 w-8 rounded border p-0 disabled:opacity-50"
            onClick={() => onPageChange?.(totalPages)}
            disabled={page === totalPages}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
