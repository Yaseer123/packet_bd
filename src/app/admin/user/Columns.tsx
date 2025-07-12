"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type User } from "@/schemas/userSchema";
import { api } from "@/trpc/react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      if (role === "ADMIN") {
        return (
          <span className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
              Admin
            </span>
          </span>
        );
      }
      return <span>{role.charAt(0) + role.slice(1).toLowerCase()}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;
      const utils = api.useUtils();
      const makeAdmin = api.user.makeAdmin.useMutation({
        onSuccess: async () => {
          await utils.user.getAll.invalidate();
        },
      });
      const removeAdmin = api.user.removeAdmin.useMutation({
        onSuccess: async () => {
          await utils.user.getAll.invalidate();
        },
      });

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <AlertDialog>
              <AlertDialogTrigger disabled={user.role === "ADMIN"} asChild>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(e: { preventDefault: () => void }) =>
                    e.preventDefault()
                  }
                >
                  Make Admin
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Making this user an admin will give them access to all the
                    admin privileges.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => makeAdmin.mutate({ id: user.id })}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger disabled={user.role !== "ADMIN"} asChild>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onSelect={(e: { preventDefault: () => void }) =>
                    e.preventDefault()
                  }
                >
                  Remove Admin
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Removing admin rights will demote this user to a regular
                    user.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => removeAdmin.mutate({ id: user.id })}
                  >
                    Remove Admin
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
