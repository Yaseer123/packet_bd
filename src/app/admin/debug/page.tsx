"use client";

import { useSession } from "next-auth/react";

export default function DebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Status:</h2>
          <p className="text-sm">{status}</p>
        </div>

        {session && (
          <div>
            <h2 className="text-lg font-semibold">Session Data:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}

        {session?.user && (
          <div>
            <h2 className="text-lg font-semibold">User Info:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>ID: {session.user.id}</li>
              <li>Email: {session.user.email}</li>
              <li>Name: {session.user.name}</li>
              <li>Role: {session.user.role}</li>
              <li>Email Verified: {session.user.emailVerified ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        )}

        {!session && status !== "loading" && (
          <div className="text-red-500">
            No session found. Please log in.
          </div>
        )}
      </div>
    </div>
  );
} 