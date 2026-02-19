import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Award,
    TrendingUp,
    Zap,
    Target,
    ChevronRight,
    Calculator,
    Info,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    isPassing,
    predictRequiredGrades,
    getSubjectInsights,
    GradeRecordWithMetadata
} from '@/utils/gradeComputation';

interface StudentAcademicInsightsProps {
    grades: GradeRecordWithMetadata[];
    quarterlyAverages: {
        q1: number | null;
        q2: number | null;
        q3: number | null;
        q4: number | null;
        annual: number | null;
    };
}

export const StudentAcademicInsights = ({ grades, quarterlyAverages }: StudentAcademicInsightsProps) => {
    const [targetAverage, setTargetAverage] = useState(85);
    const [showPredictor, setShowPredictor] = useState(false);

    // Chart Data
    const chartData = useMemo(() => {
        return [
            { name: 'Q1', avg: quarterlyAverages.q1 },
            { name: 'Q2', avg: quarterlyAverages.q2 },
            { name: 'Q3', avg: quarterlyAverages.q3 },
            { name: 'Q4', avg: quarterlyAverages.q4 },
        ].filter(d => d.avg !== null);
    }, [quarterlyAverages]);

    // Subject Insights
    const insights = useMemo(() => getSubjectInsights(grades), [grades]);

    // Prediction
    const currentGradesList = [quarterlyAverages.q1, quarterlyAverages.q2, quarterlyAverages.q3, quarterlyAverages.q4];
    const neededAverage = useMemo(
        () => predictRequiredGrades(currentGradesList, targetAverage),
        [currentGradesList, targetAverage]
    );

    const remainingQuarters = currentGradesList.filter(g => g === null).length;

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
                {/* GA Trend Chart */}
                <Card className="lg:col-span-2 overflow-hidden border-none shadow-premium bg-gradient-to-br from-white to-secondary/20 dark:from-background dark:to-secondary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            General Average Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[250px] w-full mt-4 pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <YAxis
                                        domain={[70, 100]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="avg"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorAvg)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="p-6 pt-0 flex justify-between items-center bg-secondary/5 mt-2">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-bold text-primary">Current GA: </span>
                                {quarterlyAverages.annual?.toFixed(2) || 'N/A'}
                            </div>
                            <Badge variant={isPassing(quarterlyAverages.annual) ? 'default' : 'destructive'} className="animate-pulse">
                                {isPassing(quarterlyAverages.annual) ? 'On Track' : 'Below Target'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Grade Predictor */}
                <Card className="border-none shadow-premium bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Goal Tracker
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Target Annual GA</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="75"
                                    max="100"
                                    value={targetAverage}
                                    onChange={(e) => setTargetAverage(Number(e.target.value))}
                                    className="bg-white/50 dark:bg-black/20 font-bold text-center"
                                />
                                <Button size="icon" variant="ghost" className="shrink-0">
                                    <Calculator className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
                            {remainingQuarters > 0 ? (
                                <>
                                    <p className="text-xs text-muted-foreground mb-1">Required Avg. for remaining {remainingQuarters} quarters:</p>
                                    <p className={`text-3xl font-black ${neededAverage && neededAverage > 95 ? 'text-orange-600' : 'text-primary'}`}>
                                        {neededAverage !== null ? neededAverage : 'N/A'}
                                    </p>
                                    {neededAverage && neededAverage > 100 && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-destructive font-bold uppercase">
                                            <AlertCircle className="h-3 w-3" />
                                            Impossible Target
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-2">
                                    <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="text-sm font-bold">Academic Year Completed</p>
                                </div>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] hover:bg-white/40"
                            onClick={() => setShowPredictor(!showPredictor)}
                        >
                            <Info className="h-3 w-3 mr-1" />
                            How is this calculated?
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Subject Insights / Streaks */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Subject Insights & Streaks
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {insights.slice(0, 4).map((insight, idx) => (
                                <motion.div
                                    key={`${insight.subjectCode}-${insight.type}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-background/50 backdrop-blur-sm border-l-4 border-l-primary">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-primary flex items-center gap-1">
                                                    {insight.type === 'improvement' && <TrendingUp className="h-3 w-3" />}
                                                    {insight.type === 'passing_streak' && <Award className="h-3 w-3" />}
                                                    {insight.type === 'consistent' && <CheckCircle2 className="h-3 w-3" />}
                                                    {insight.type.replace('_', ' ').toUpperCase()}
                                                </p>
                                                <h4 className="text-sm font-semibold truncate mt-0.5">{insight.subjectName}</h4>
                                                <p className="text-[10px] text-muted-foreground line-clamp-1">{insight.description}</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary font-black ml-2">
                                                {insight.value}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                            {insights.length === 0 && (
                                <div className="sm:col-span-2 p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                                    <p className="text-sm text-muted-foreground italic">Keep pushing! Insights will appear as more grades are posted.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Quick Tips */}
                <Card className="bg-primary/5 border-dashed border-primary/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Pro Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-xs">
                                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                                <span>Consistent study streaks help maintain a "Stable" subject rating.</span>
                            </li>
                            <li className="flex gap-2 text-xs">
                                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                                <span>Improve your score by just <span className="font-bold text-primary">2 pts</span> to hit your next milestone.</span>
                            </li>
                            <li className="flex gap-2 text-xs">
                                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                                <span>Check the <strong>Assignments</strong> tab regularily to ensure no overdue tasks.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
