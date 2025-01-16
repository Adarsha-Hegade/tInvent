import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colors } from '@/lib/colors';

const data = [
  { name: 'Jan', total: 124 },
  { name: 'Feb', total: 156 },
  { name: 'Mar', total: 142 },
  { name: 'Apr', total: 189 },
  { name: 'May', total: 167 },
  { name: 'Jun', total: 212 },
  { name: 'Jul', total: 198 },
  { name: 'Aug', total: 234 },
  { name: 'Sep', total: 246 },
];

export function Overview() {
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