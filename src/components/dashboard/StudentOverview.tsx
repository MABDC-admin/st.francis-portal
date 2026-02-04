import { motion } from 'framer-motion';
import { Settings, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { Student } from '@/types/student';

interface StudentOverviewProps {
  students: Student[];
}

export const StudentOverview = ({ students }: StudentOverviewProps) => {
  // Process grade distribution
  const gradeDistribution = students.reduce((acc, student) => {
    const level = student.level || 'Unknown';
    const existing = acc.find(item => item.name === level);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: level, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[])
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4);

  const total = gradeDistribution.reduce((sum, item) => sum + item.value, 0);
  
  const pieData = gradeDistribution.map((item, index) => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));

  // Color palette matching the design
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#22C55E'];
  
  // Gender bar chart data by month (mock data)
  const monthlyData = [
    { month: 'Apr%', male: 80, female: 60 },
    { month: '19%', male: 90, female: 50 },
    { month: 'Apr%', male: 70, female: 80 },
    { month: '80%B', male: 110, female: 70 },
    { month: 'Apr%', male: 85, female: 55 },
    { month: '17%', male: 95, female: 45 },
    { month: 'Apr%', male: 75, female: 65 },
    { month: '30%', male: 100, female: 60 },
    { month: '30%', male: 90, female: 70 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Student Overview</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pie Chart with Grade Legend */}
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${percent}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{total}</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-1.5 text-sm">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">{item.percent}%</span>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-info rounded-sm" /> Male
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-sm" /> Female
                </span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: 11,
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="male" fill="#3B82F6" radius={[2, 2, 0, 0]} barSize={8} />
                <Bar dataKey="female" fill="#F59E0B" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
