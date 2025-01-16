import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProducts } from '../../../hooks/useProducts';
import ProductTable from './ProductTable';
import ProductModal from './ProductModal';
import ProductImport from './ProductImport';

export default function ProductList() {
  const { products, loading, addProduct, updateProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <div className="flex gap-4">
          <ProductImport />
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <ProductTable
        products={products}
        onEdit={(product) => {
          setSelectedProduct(product);
          setIsModalOpen(true);
        }}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={selectedProduct ? updateProduct : addProduct}
        product={selectedProduct}
      />
    </div>
  );
}