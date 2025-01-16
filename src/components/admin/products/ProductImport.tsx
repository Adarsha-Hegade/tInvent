import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useProducts } from '../../../hooks/useProducts';
import { parseCSV } from '../../../utils/csv';

export default function ProductImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addProduct } = useProducts();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const products = await parseCSV(file);
      for (const product of products) {
        await addProduct(product);
      }
      alert('Products imported successfully!');
    } catch (error) {
      alert('Error importing products. Please check your CSV file format.');
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </button>
    </>
  );
}