import React from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { useAuthStore } from '../../../store/authStore';
import { AVAILABLE_COLUMNS } from '../../../constants/columns';

export default function ProductView() {
  const { products, loading } = useProducts();
  const { user } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  const allowedColumns = AVAILABLE_COLUMNS.filter(
    column => user?.assigned_columns.includes(column.value)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Products</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {allowedColumns.map(column => (
                <th
                  key={column.value}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                {allowedColumns.map(column => (
                  <td
                    key={column.value}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {product[column.value]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}