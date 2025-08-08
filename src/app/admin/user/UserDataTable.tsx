"use client";

import { columns } from "@/app/admin/user/Columns";
import { DataTable } from "@/components/admin-components/DataTable";
import { api } from "@/trpc/react";

export default function UserDataTable() {
  const { data = [], isLoading } = api.user.getAll.useQuery();

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceHolder="Filter users by name"
      isLoading={isLoading}
    />
  );
}
