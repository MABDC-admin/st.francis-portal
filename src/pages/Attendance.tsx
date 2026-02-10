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
    ShieldCheck,
    Camera,
    CameraOff
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
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export const Attendance = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedYearId } = useAcademicYear();

    const [mode, setMode] = useState<'in' | 'out'>('in');
    const [lrn, setLrn] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastStudent, setLastStudent] = useState<any>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

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

            const autoSubmit = setTimeout(() => {
                handleAttendance(queryLrn, queryMode || mode);
            }, 800);
            return () => clearTimeout(autoSubmit);
        }
    }, [searchParams]);

    // QR Scanner Lifecycle
    useEffect(() => {
        if (isCameraActive && !showSuccess) {
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            html5QrCode.start(
                { facingMode: "user" }, // Use front camera
                config,
                (decodedText) => {
                    // Success callback
                    if (decodedText && decodedText.length >= 5) {
                        setLrn(decodedText);
                        handleAttendance(decodedText, mode);
                        // Don't stop here, we'll stop when camera state changes or success shows
                    }
                },
                (errorMessage) => {
                    // parse error, ignore it
                }
            ).catch((err) => {
                console.error("Camera Error:", err);
                toast.error("Camera access denied or unavailable");
                setIsCameraActive(false);
            });

            return () => {
                if (scannerRef.current?.isScanning) {
                    scannerRef.current.stop().catch(e => console.error("failed to stop", e));
                }
            };
        }
    }, [isCameraActive, showSuccess]);

    const handleAttendance = async (inputLrn: string, currentMode: 'in' | 'out') => {
        if (!inputLrn || inputLrn.length < 5 || isSubmitting) return;

        setIsSubmitting(true);
        // Vibrate on scan if available
        if (navigator.vibrate) navigator.vibrate(100);

        try {
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('lrn', inputLrn)
                .maybeSingle();

            if (studentError || !student) {
                toast.error('Student not found', { description: 'Please check the LRN/QR code and try again.' });
                setIsSubmitting(false);
                return;
            }

            const schoolToUse = student.school_id || 'SFXSAI';
            const academicYearToUse = selectedYearId || student.academic_year_id;
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

            setLastStudent(student);
            setShowSuccess(true);
            setLrn('');

            // Stop scanning if active
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
            }

            toast.success(`${student.student_name} ${currentMode === 'in' ? 'Checked In' : 'Checked Out'}`);

            setTimeout(() => {
                setShowSuccess(false);
                // We'll let the user reactivate camera if they want, or keep it off
            }, 5000);

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
        #qr-reader {
          border: none !important;
          border-radius: 1.5rem;
          overflow: hidden;
        }
        #qr-reader video {
            border-radius: 1.5rem !important;
            object-fit: cover !important;
        }
        #qr-reader__scan_region {
            border-radius: 1.5rem !important;
        }
      `}} />

            <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center text-left">

                {/* Left Side: Info & Clock (Col span 2) */}
                <div className="lg:col-span-2 space-y-8">
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
                            San/Enter LRN for automated tracking.
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

                {/* Right Side: Input & Result & Camera (Col span 3) */}
                <div className="lg:col-span-3 relative h-auto min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {!showSuccess ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full glass-panel rounded-[2.5rem] p-8 lg:p-10 flex flex-col"
                            >
                                <div className="flex-1 space-y-8">
                                    {/* Camera Section */}
                                    <div className="relative aspect-video lg:aspect-square max-h-[300px] w-full mx-auto glass-panel rounded-3xl overflow-hidden flex items-center justify-center">
                                        {isCameraActive ? (
                                            <div id="qr-reader" className="w-full h-full" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 text-white/20">
                                                <CameraOff className="h-20 w-20" />
                                                <p className="font-bold uppercase tracking-widest text-sm text-center px-4">Camera Paused</p>
                                            </div>
                                        )}

                                        <Button
                                            onClick={() => setIsCameraActive(!isCameraActive)}
                                            className={cn(
                                                "absolute top-4 right-4 h-12 w-12 rounded-2xl p-0",
                                                isCameraActive ? "bg-red-500/80 hover:bg-red-600" : "bg-emerald-500/80 hover:bg-emerald-600"
                                            )}
                                        >
                                            {isCameraActive ? <CameraOff /> : <Camera />}
                                        </Button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-white/40 text-xs font-bold uppercase tracking-widest ml-1">
                                                Manual Entry
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20" />
                                                <Input
                                                    ref={inputRef}
                                                    value={lrn}
                                                    onChange={(e) => setLrn(e.target.value)}
                                                    placeholder="SCAN QR OR ENTER LRN..."
                                                    className="h-20 bg-white/5 border-white/10 text-3xl font-mono text-center pl-16 pr-8 rounded-3xl placeholder:text-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || lrn.length < 5}
                                            className={cn(
                                                "w-full h-16 text-lg font-black rounded-2xl transition-all shadow-2xl",
                                                mode === 'in' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
                                            )}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <ScanQrCode className="h-5 w-5" />
                                                    CONFIRM {mode === 'in' ? 'IN' : 'OUT'}
                                                </div>
                                            )}
                                        </Button>
                                    </form>
                                </div>

                                <p className="text-center text-white/10 text-[10px] mt-8 uppercase tracking-widest">
                                    Magic Link / QR Auto-Detect Active
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
                                    <div className="relative h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                                        <CheckCircle2 className="h-12 w-12 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter">Success!</h2>
                                    <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">
                                        Attendance Recorded Correctley
                                    </p>
                                </div>

                                {lastStudent && (
                                    <div className="w-full mt-2 p-6 rounded-3xl bg-white/5 border border-white/10">
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
                                    className="text-white/40 hover:text-white pt-4"
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
