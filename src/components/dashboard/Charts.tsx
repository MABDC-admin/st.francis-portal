import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Student } from "@/types/student";

interface ChartsProps {
  students: Student[];
}

const palette = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--hrms-success))",
];

export const Charts = ({ students }: ChartsProps) => {
  const levelData = students
    .reduce((accumulator, student) => {
      const level = student.level || "Unknown";
      const existing = accumulator.find((item) => item.level === level);
      if (existing) {
        existing.count += 1;
      } else {
        accumulator.push({ level, count: 1 });
      }
      return accumulator;
    }, [] as { level: string; count: number }[])
    .sort((a, b) => a.level.localeCompare(b.level));

  const genderData = students.reduce((accumulator, student) => {
    const gender = student.gender || "Not Specified";
    const existing = accumulator.find((item) => item.name === gender);
    if (existing) {
      existing.value += 1;
    } else {
      accumulator.push({ name: gender, value: 1 });
    }
    return accumulator;
  }, [] as { name: string; value: number }[]);

  const tooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-lg border bg-card p-3 shadow-card">
        <p className="text-sm font-semibold text-foreground">{label || payload[0].name}</p>
        <p className="text-xs text-muted-foreground">
          Learners: <span className="font-semibold text-foreground">{payload[0].value}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="page-surface p-6"
      >
        <div className="mb-5">
          <p className="micro-label">Distribution</p>
          <h3 className="text-lg font-semibold text-foreground">Learners by level</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="level" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={tooltip} cursor={{ fill: "hsl(var(--accent))" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="page-surface p-6"
      >
        <div className="mb-5">
          <p className="micro-label">Composition</p>
          <h3 className="text-lg font-semibold text-foreground">Learner status mix</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={62} outerRadius={96} paddingAngle={3} dataKey="value">
                {genderData.map((_, index) => (
                  <Cell key={index} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip content={tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          {genderData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
              <span className="font-medium text-foreground">{item.name}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
