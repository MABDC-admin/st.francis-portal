import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    LogIn,
    LogOut,
    User,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    ScanQrCode,
    Loader2,
    CalendarDays,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { cn } from '@/lib/utils';

export const Attendance = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedSchool } = useSchool();
    const { selectedYearId } = useAcademicYear();

    const [mode, setMode] = useState<'in' | 'out'>('in');
    const [lrn, setLrn] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastStudent, setLastStudent] = useState<any>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // Clock Update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Handle Magic Link (Query Params)
    useEffect(() => {
        const queryLrn = searchParams.get('lrn');
        const queryMode = searchParams.get('mode') as 'in' | 'out';

        if (queryLrn && queryLrn.length >= 5) {
            setLrn(queryLrn);
            if (queryMode) setMode(queryMode);

            // Auto-submit after a brief delay
            const autoSubmit = setTimeout(() => {
                handleAttendance(queryLrn, queryMode || mode);
            }, 800);
            return () => clearTimeout(autoSubmit);
        }
    }, [searchParams]);

    const handleAttendance = async (inputLrn: string, currentMode: 'in' | 'out') => {
        if (!inputLrn || inputLrn.length < 5) return;

        setIsSubmitting(true);
        try {
            // 1. Find the student
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('lrn', inputLrn)
                .maybeSingle();

            if (studentError || !student) {
                toast.error('Student not found', { description: 'Please check the LRN and try again.' });
                setIsSubmitting(false);
                return;
            }

            // 2. Determine School Context (if not already set)
            const schoolToUse = student.school_id || 'MABDC';
            const academicYearToUse = selectedYearId || student.academic_year_id;

            // 3. Record Attendance
            const today = format(new Date(), 'yyyy-MM-dd');
            const timeStr = format(new Date(), 'HH:mm:ss');

            const payload: any = {
                student_id: student.id,
                date: today,
                status: 'present',
                school_id: schoolToUse,
                academic_year_id: academicYearToUse,
                remarks: `Kiosk ${currentMode === 'in' ? 'Check-In' : 'Check-Out'}`
            };

            if (currentMode === 'in') {
                payload.time_in = timeStr;
            } else {
                payload.time_out = timeStr;
            }

            // Check if record already exists for today
            const { data: existing } = await supabase
                .from('student_attendance')
                .select('*')
                .eq('student_id', student.id)
                .eq('date', today)
                .maybeSingle();

            if (existing) {
                const { error: updateError } = await supabase
                    .from('student_attendance')
                    .update(currentMode === 'in' ? { time_in: timeStr } : { time_out: timeStr })
                    .eq('id', existing.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('student_attendance')
                    .insert(payload);

                if (insertError) throw insertError;
            }

            // 4. Success UI
            setLastStudent(student);
            setShowSuccess(true);
            setLrn('');
            toast.success(`${student.student_name} ${currentMode === 'in' ? 'Checked In' : 'Checked Out'}`);

            // Reset success message after 5 seconds
            setTimeout(() => setShowSuccess(false), 5000);

        } catch (err: any) {
            console.error('Attendance Error:', err);
            toast.error('System Error', { description: 'Could not record attendance. Please inform the registrar.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAttendance(lrn, mode);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 lg:p-12 overflow-hidden bg-slate-950 text-white font-sans">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}} />

            <div className="w-full max-w-4xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Left Side: Info & Clock */}
                <div className="space-y-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-white/40 hover:text-white mb-4 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Portal
                    </Button>

                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-emerald-500/20">
                            <ShieldCheck className="h-3 w-3" />
                            Secure Attendance Kiosk
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none">
                            {mode === 'in' ? 'TIME IN' : 'TIME OUT'}
                        </h1>
                        <p className="text-white/40 text-lg">
                            Automated attendance system for students.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Clock className="h-10 w-10 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-mono font-bold tracking-widest">
                                    {format(currentTime, 'HH:mm:ss')}
                                </h2>
                                <div className="flex items-center gap-2 text-white/40 text-sm">
                                    <CalendarDays className="h-3 w-3" />
                                    {format(currentTime, 'EEEE, MMMM do yyyy')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => setMode('in')}
                            className={cn(
                                "flex-1 h-16 rounded-2xl text-lg font-bold transition-all border-2",
                                mode === 'in'
                                    ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            <LogIn className="h-5 w-5 mr-3" />
                            Check In
                        </Button>
                        <Button
                            onClick={() => setMode('out')}
                            className={cn(
                                "flex-1 h-16 rounded-2xl text-lg font-bold transition-all border-2",
                                mode === 'out'
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            Check Out
                        </Button>
                    </div>
                </div>

                {/* Right Side: Input & Result */}
                <div className="relative h-[500px]">
                    <AnimatePresence mode="wait">
                        {!showSuccess ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full glass-panel rounded-[2.5rem] p-8 lg:p-12 flex flex-col justify-center"
                            >
                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-white/40 text-sm font-bold uppercase tracking-widest ml-1">
                                            Student Identity (LRN)
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-white/20" />
                                            <Input
                                                ref={inputRef}
                                                value={lrn}
                                                onChange={(e) => setLrn(e.target.value)}
                                                placeholder="Enter LRN..."
                                                className="h-24 bg-white/5 border-white/10 text-4xl font-mono text-center pl-16 pr-8 rounded-3xl placeholder:text-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || lrn.length < 5}
                                        className={cn(
                                            "w-full h-20 text-xl font-black rounded-3xl transition-all shadow-2xl",
                                            mode === 'in' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <ScanQrCode className="h-6 w-6" />
                                                SUBMIT {mode === 'in' ? 'IN' : 'OUT'}
                                            </div>
                                        )}
                                    </Button>
                                </form>

                                <p className="text-center text-white/20 text-xs mt-12 uppercase tracking-tight">
                                    Magic Link Active. URL Params: ?lrn=VAL&mode=in|out
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.1, opacity: 0 }}
                                className="h-full glass-panel rounded-[2.5rem] p-8 lg:p-12 border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-6"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[40px] opacity-20" />
                                    <div className="relative h-32 w-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                                        <CheckCircle2 className="h-16 w-16 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black uppercase tracking-tighter">Success!</h2>
                                    <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">
                                        Attendance Recorded Correctley
                                    </p>
                                </div>

                                {lastStudent && (
                                    <div className="w-full mt-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                                        <h3 className="text-2xl font-black uppercase">
                                            {lastStudent.student_name}
                                        </h3>
                                        <p className="text-white/40 text-sm">
                                            LRN: {lastStudent.lrn} • {lastStudent.level}
                                        </p>
                                        <div className="mt-4 flex items-center justify-center gap-2 text-emerald-500 text-sm font-bold uppercase">
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(), 'hh:mm a')}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    variant="ghost"
                                    onClick={() => setShowSuccess(false)}
                                    className="text-white/40 hover:text-white"
                                >
                                    Next Student Please
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
