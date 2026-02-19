import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Banner {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    thumbnail_url?: string;
}

export const PromotionalSlider = ({ schoolId }: { schoolId: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch banners from Supabase
    const { data: banners, isLoading } = useQuery({
        queryKey: ['promotional-banners', schoolId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('promotional_banners' as any)
                .select('*')
                .eq('school_id', schoolId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn("Could not fetch banners (table might not exist yet):", error);
                return mockBanners as Banner[];
            }
            return (data as any[] || mockBanners) as Banner[];
        },
        enabled: !!schoolId,
    });

    const mockBanners: Banner[] = [
        {
            id: '1',
            type: 'image',
            url: '/assets/timetable-header.png',
            title: 'Welcome Back to School!'
        },
        {
            id: '2',
            type: 'image',
            url: '/assets/assignment-header.png',
            title: 'New Student Elections'
        }
    ];

    const currentBanner = (banners as Banner[] | undefined)?.[currentIndex];

    // Auto-slide logic
    useEffect(() => {
        if (!isPlaying || !banners || banners.length <= 1) return;

        // Don't slide if current item is a video and it's playing
        if (currentBanner?.type === 'video') return;

        const timer = setInterval(() => {
            handleNext();
        }, 5000);

        return () => clearInterval(timer);
    }, [currentIndex, isPlaying, banners, currentBanner]);

    const handleNext = () => {
        if (!banners) return;
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const handlePrev = () => {
        if (!banners) return;
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    if (isLoading || !currentBanner) {
        return <div className="w-full h-48 bg-slate-100 animate-pulse rounded-[2rem]" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#3D5A42] rounded-[2rem] overflow-hidden shadow-2xl"
        >

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBanner.id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 flex items-center justify-center bg-[#2D4532]"
                >
                    {currentBanner.type === 'video' ? (
                        <div className="relative w-full h-full">
                            <video
                                ref={videoRef}
                                src={currentBanner.url}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop={false}
                                muted={isMuted}
                                onPlay={() => setIsPlaying(false)} // Pause slider when video plays
                                onEnded={() => {
                                    setIsPlaying(true);
                                    handleNext();
                                }}
                                playsInline
                            />
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="absolute bottom-6 right-6 z-30 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-colors"
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </div>
                    ) : (
                        <img
                            src={currentBanner.url}
                            alt={currentBanner.title}
                            className="w-full h-full object-cover"
                        />
                    )}

                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-6 z-30">
                <button
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex gap-1.5">
                    {(banners || mockBanners).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                currentIndex === i ? "w-6 bg-white shadow-lg" : "w-1.5 bg-white/40"
                            )}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Play/Pause indicator for Slider auto-play */}
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute top-6 right-6 z-30 w-8 h-8 rounded-full bg-black/20 text-white/60 flex items-center justify-center backdrop-blur-sm hover:text-white transition-all"
            >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>

        </motion.div>
    );
};
