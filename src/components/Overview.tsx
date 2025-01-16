import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';

interface MonthlyData {
  name: string;
  total: number;
}

export function Overview() {
  const [data, setData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('created_at, total_stock')
        .order('created_at');

      if (products) {
        const monthlyData = products.reduce((acc: { [key: string]: number }, product) => {
          const month = new Date(product.created_at).toLocaleString('default', { month: 'short' });
          acc[month] = (acc[month] || 0) + product.total_stock;
          return acc;
        }, {});

        const formattedData = Object.entries(monthlyData).map(([name, total]) => ({
          name,
          total,
        }));

        setData(formattedData);
      }
    };

    fetchMonthlyData();

    // Subscribe to changes
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchMonthlyData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="pt-4">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <XAxis 
            dataKey="name" 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}`}
            width={40}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke={colors.chart.line}
            strokeWidth={3}
            dot={{ fill: colors.chart.line, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: colors.chart.line }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}