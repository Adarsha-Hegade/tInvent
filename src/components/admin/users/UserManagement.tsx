import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useUsers } from '../../../hooks/useUsers';
import UserTable from './UserTable';
import UserModal from './UserModal';

export default function UserManagement() {
  const { users, loading, addUser, updateUser } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <UserTable
        users={users}
        onEdit={(user) => {
          setSelectedUser(user);
          setIsModalOpen(true);
        }}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={selectedUser ? updateUser : addUser}
        user={selectedUser}
      />
    </div>
  );
}