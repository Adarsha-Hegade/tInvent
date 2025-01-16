import React from 'react';
import { useForm } from '../../../hooks/useForm';
import type { User } from '../../../types';
import { AVAILABLE_COLUMNS } from '../../../constants/columns';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: any) => Promise<void>;
  user?: User | null;
}

export default function UserModal({ isOpen, onClose, onSubmit, user }: UserModalProps) {
  const { values, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: user || {
      email: '',
      username: '',
      assigned_columns: [],
      access_level: 'read',
    },
    onSubmit: async (values) => {
      await onSubmit(user ? { id: user.id, ...values } : values);
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-lg font-medium mb-6">
            {user ? 'Edit User' : 'Add User'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={values.username}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Access Level
              </label>
              <select
                name="access_level"
                value={values.access_level}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="read">Read Only</option>
                <option value="read-write">Read & Write</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Assigned Columns
              </label>
              <div className="mt-2 space-y-2">
                {AVAILABLE_COLUMNS.map((column) => (
                  <label key={column.value} className="flex items-center">
                    <input
                      type="checkbox"
                      name="assigned_columns"
                      value={column.value}
                      checked={values.assigned_columns.includes(column.value)}
                      onChange={(e) => {
                        const newColumns = e.target.checked
                          ? [...values.assigned_columns, column.value]
                          : values.assigned_columns.filter((c) => c !== column.value);
                        handleChange({
                          target: { name: 'assigned_columns', value: newColumns },
                        } as any);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}