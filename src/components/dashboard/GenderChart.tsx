import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Student } from '@/types/student';

interface GenderChartProps {
  students: Student[];
}

export const GenderChart = ({ students }: GenderChartProps) => {
  const maleCount = students.filter(s => s.gender?.toUpperCase() === 'MALE').length;
  const femaleCount = students.filter(s => s.gender?.toUpperCase() === 'FEMALE').length;
  const total = maleCount + femaleCount;
  
  const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;

  const data = [
    { name: 'Male', value: maleCount, percent: malePercent, color: '#3B82F6' },
    { name: 'Female', value: femaleCount, percent: femalePercent, color: '#F59E0B' },
  ];

  // Additional breakdown (mock)
  const breakdown = [
    { label: '11%', sublabel: '', color: '#22C55E' },
    { label: '80%', sublabel: '', color: '#EF4444' },
    { label: 'Emale', sublabel: '22%', color: '#8B5CF6' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="h-full relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 absolute top-2 right-2"
        >
          <X className="h-4 w-4" />
        </Button>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Donut Chart */}
            <div className="w-28 h-28 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Male</span>
                <span className="text-lg font-bold text-info">{malePercent}%</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-success rounded-sm" />
                <span className="text-muted-foreground">{malePercent}%</span>
                <div className="w-4 h-3 bg-destructive rounded-sm" />
                <span className="font-medium">Male</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-warning rounded-sm" />
                <span className="text-muted-foreground">{femalePercent}%</span>
                <div className="w-4 h-3 bg-info rounded-sm" />
                <span className="font-medium">Female</span>
              </div>
              <div className="pt-2 space-y-1">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.label} —</span>
                    {item.sublabel && <span>◆ {item.sublabel}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
