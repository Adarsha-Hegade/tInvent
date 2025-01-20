import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { addDays, format, startOfDay, endOfDay, subDays, subMonths, subWeeks } from 'date-fns';

type TimeRange = 'week' | 'month' | 'custom';
type DateRange = { from: Date; to: Date } | undefined;

interface ChartData {
  name: string;
  total: number;
}

export function Overview() {
  const [data, setData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [dateRange, setDateRange] = useState<DateRange>();

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return {
          from: startOfDay(subWeeks(now, 1)),
          to: endOfDay(now)
        };
      case 'month':
        return {
          from: startOfDay(subMonths(now, 1)),
          to: endOfDay(now)
        };
      case 'custom':
        return dateRange;
      default:
        return {
          from: startOfDay(subMonths(now, 1)),
          to: endOfDay(now)
        };
    }
  };

  useEffect(() => {
    const range = getDateRange();
    if (!range?.from || !range?.to) return;

    const fetchData = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('created_at, total_stock')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
        .order('created_at');

      if (products) {
        const groupedData = products.reduce((acc: { [key: string]: number }, product) => {
          const date = new Date(product.created_at);
          const key = timeRange === 'week' 
            ? format(date, 'EEE') 
            : format(date, 'MMM d');
          
          acc[key] = (acc[key] || 0) + product.total_stock;
          return acc;
        }, {});

        const formattedData = Object.entries(groupedData).map(([name, total]) => ({
          name,
          total,
        }));

        setData(formattedData);
      }
    };

    fetchData();
  }, [timeRange, dateRange]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        
        {timeRange === 'custom' && (
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        )}
      </div>

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
              style={{ fontSize: '12px', fill: '#888888' }}
            />
            <YAxis 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `${value}`}
              width={40}
              style={{ fontSize: '12px', fill: '#888888' }}
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
    </div>
  );
}