import UserDataTable from "./UserDataTable";

export default function UserListPage() {
  return (
    <div className="p-4 md:p-10">
      <p className="text-center text-2xl font-semibold">User Information</p>
      <UserDataTable />
    </div>
  );
}
