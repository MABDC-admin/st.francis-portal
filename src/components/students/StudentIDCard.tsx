import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import {
    CreditCard,
    RotateCw,
    MapPin,
    Phone,
    Globe,
    Mail,
    User,
    ShieldCheck,
    Calendar,
    Hash
} from 'lucide-react';
import { Student } from '@/types/student';

interface StudentIDCardProps {
    student: Student;
}

export const StudentIDCard = ({ student }: StudentIDCardProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    useEffect(() => {
        const generateQR = async () => {
            try {
                const url = await QRCode.toDataURL(student.lrn, {
                    margin: 1,
                    scale: 8,
                    color: {
                        dark: '#0f172a',
                        light: '#ffffff',
                    },
                });
                setQrDataUrl(url);
            } catch (err) {
                console.error('QR Generation Error:', err);
            }
        };
        generateQR();
    }, [student.lrn]);

    return (
        <div className="flex flex-col items-center gap-6 py-8">
            {/* 3D Flip Card Container */}
            <div
                className="relative w-[340px] h-[520px] cursor-pointer group perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <motion.div
                    className="w-full h-full relative preserve-3d transition-all duration-700"
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                    {/* Front Side */}
                    <div className={`absolute inset-0 backface-hidden rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-primary via-primary to-[#0f172a] shadow-2xl border-4 border-white/20 select-none`}>
                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

                        {/* Header / Logo */}
                        <div className="pt-10 pb-6 px-8 text-center bg-white/5 backdrop-blur-sm">
                            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-white font-black tracking-tighter text-xl uppercase leading-none">
                                {student.school || 'St. Francis Xavier Smart Academy Inc'}
                            </h2>
                            <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-medium mt-1">
                                Student Information System
                            </p>
                        </div>

                        {/* Photo Section */}
                        <div className="px-8 mt-6">
                            <div className="relative mx-auto w-40 h-40">
                                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[1.5rem] blur-xl" />
                                <div className="relative rounded-[1.5rem] overflow-hidden border-4 border-white shadow-xl bg-slate-200">
                                    {student.photo_url ? (
                                        <img
                                            src={student.photo_url}
                                            alt={student.student_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                            <User className="h-20 w-20 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                {/* NFC/RFID Icon Decor */}
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* Name & Details */}
                        <div className="px-8 mt-8 text-center">
                            <h1 className="text-white text-2xl font-black leading-tight uppercase tracking-tight">
                                {student.student_name}
                            </h1>
                            <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                <Hash className="h-3 w-3 text-white/70" />
                                <span className="text-white font-mono text-sm tracking-widest">{student.lrn}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="text-center">
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Level</p>
                                    <p className="text-white font-bold text-sm truncate">{student.level}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Session</p>
                                    <p className="text-white font-bold text-sm">2025-2026</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600" />
                    </div>

                    {/* Back Side */}
                    <div className={`absolute inset-0 backface-hidden rounded-[2.5rem] overflow-hidden bg-[#0f172a] shadow-2xl border-4 border-white/20 rotate-y-180 select-none`}>
                        {/* Header */}
                        <div className="pt-10 px-8 flex justify-center">
                            <div className="p-4 bg-white rounded-3xl shadow-xl transform group-hover:scale-105 transition-transform overflow-hidden">
                                {qrDataUrl ? (
                                    <img
                                        src={qrDataUrl}
                                        alt="Student QR Code"
                                        className="w-40 h-40 object-contain"
                                    />
                                ) : (
                                    <div className="w-40 h-40 flex items-center justify-center bg-slate-100">
                                        <div className="h-20 w-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="mt-8 px-8 space-y-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-primary text-[10px] uppercase font-black tracking-widest flex items-center gap-2 mb-2">
                                    <ShieldCheck className="h-3 w-3" />
                                    Verification Details
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/40">Status</span>
                                        <span className="text-green-400 font-bold uppercase">Active Member</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/40">Issuance</span>
                                        <span className="text-white/90">Feb 2026</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/40">Expires</span>
                                        <span className="text-white/90">May 2026</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider px-2">Contacts</p>
                                <div className="flex items-center gap-3 text-white/80 text-xs px-2">
                                    <Phone className="h-3 w-3 text-primary" />
                                    <span>+63 45 123 4567</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/80 text-xs px-2">
                                    <Globe className="h-3 w-3 text-primary" />
                                    <span>www.registrar2025.edu</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/80 text-xs px-2">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    <span className="truncate">Dubai, United Arab Emirates</span>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="absolute bottom-8 left-0 right-0 px-10 text-center">
                            <p className="text-[9px] text-white/30 leading-tight">
                                This is an official digital identification of {student.school || 'the institution'}.
                                Unauthorized use or alteration is strictly prohibited.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <p className="text-sm text-muted-foreground flex items-center gap-2 animate-bounce">
                <RotateCw className="h-4 w-4" />
                Tap card to flip
            </p>

            <style>{`
        .perspective-1000 {
            perspective: 1000px;
        }
        .preserve-3d {
            transform-style: preserve-3d;
        }
        .backface-hidden {
            backface-visibility: hidden;
        }
        .rotate-y-180 {
            transform: rotateY(180deg);
        }
      `}</style>
        </div>
    );
};
