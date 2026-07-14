"use client";

import CreateUserForm from "./CreateUserForm";
import UserRow from "./UserRow";

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  family_branch: string | null;
  role: string;
  active: boolean;
};

export default function UsersManager({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-6">
      <CreateUserForm />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Membres de la famille</h2>
        <ul className="space-y-2">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
