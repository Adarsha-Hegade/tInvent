export interface Admin {
  id: string;
  username: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  assigned_columns: string[];
  access_level: 'read' | 'read-write';
  created_at: string;
}

export interface Product {
  id: string;
  model_no: string;
  name: string;
  description: string;
  size: string;
  finish: string;
  manufacturer: string;
  total_stock: number;
  bad_stock: number;
  bookings: number;
  available_stock: number;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  contact_info: string;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  booking_date: string;
  created_at: string;
}