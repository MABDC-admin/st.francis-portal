import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Student } from '@/types/student';

interface ChartsProps {
  students: Student[];
}

export const Charts = ({ students }: ChartsProps) => {
  // Process data for level distribution
  const levelData = students.reduce((acc, student) => {
    const level = student.level || 'Unknown';
    const existing = acc.find(item => item.level === level);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ level, count: 1 });
    }
    return acc;
  }, [] as { level: string; count: number }[])
    .sort((a, b) => a.level.localeCompare(b.level));

  // Process data for gender distribution
  const genderData = students.reduce((acc, student) => {
    const gender = student.gender || 'Not Specified';
    const existing = acc.find(item => item.name === gender);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: gender, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['hsl(259, 67%, 59%)', 'hsl(340, 82%, 59%)', 'hsl(45, 93%, 58%)', 'hsl(158, 64%, 52%)'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{label || payload[0].name}</p>
          <p className="text-muted-foreground">
            Learners: <span className="font-semibold text-primary">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Level Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 shadow-card"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Learners by Level</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="level" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="hsl(259, 67%, 59%)" 
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Gender Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-6 shadow-card"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Gender Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};
