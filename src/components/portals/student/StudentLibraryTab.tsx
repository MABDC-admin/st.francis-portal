import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StudentPortalIcon, STUDENT_ICONS } from '@/components/icons/StudentPortalIcons';
import { Search, BookOpen, Download, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MOCK_RESOURCES = [
    { id: 1, title: 'Introduction to Geometry', author: 'Dr. Sarah Wilson', type: 'EPUB', size: '4.2 MB', color: 'bg-blue-50 text-blue-500', icon: STUDENT_ICONS.math },
    { id: 2, title: 'Philippine History Vol. 1', author: 'Prof. Antonio Luna', type: 'PDF', size: '12.8 MB', color: 'bg-emerald-50 text-emerald-500', icon: STUDENT_ICONS.socialStudies },
    { id: 3, title: 'English Grammar Guide', author: 'Teacher Mary Sue', type: 'EPUB', size: '3.1 MB', color: 'bg-rose-50 text-rose-500', icon: STUDENT_ICONS.english },
    { id: 4, title: 'Periodic Table Basics', author: 'Science Dept', type: 'PDF', size: '2.5 MB', color: 'bg-purple-50 text-purple-500', icon: STUDENT_ICONS.science },
    { id: 5, title: 'Classic Literature Reader', author: 'Anthology', type: 'PDF', size: '15.2 MB', color: 'bg-amber-50 text-amber-500', icon: STUDENT_ICONS.filipino },
    { id: 6, title: 'IT & Programming 101', author: 'TLE Department', type: 'EPUB', size: '8.4 MB', color: 'bg-sky-50 text-sky-500', icon: STUDENT_ICONS.tle },
];

export const StudentLibraryTab = () => {
    return (
        <div className="flex flex-col min-h-screen bg-[#FDFCF8] -m-4 sm:-m-0 rounded-t-[3rem] overflow-hidden">
            {/* Illustrative Header Img - Fully Flexible, No Cutting */}
            <div className="relative w-full overflow-hidden shrink-0">
                <img
                    src="/assets/library-header.png"
                    alt="Library"
                    className="w-full h-auto block"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FDFCF8] to-transparent" />
            </div>

            <div className="px-4 -mt-10 relative z-10 space-y-8">
                {/* Search Bar matching other pages */}
                <div className="relative group">
                    <Input
                        placeholder="Search books, authors, or subjects..."
                        className="w-full h-14 pl-12 pr-4 rounded-[2rem] border-none bg-white shadow-lg focus:ring-2 focus:ring-sky-200 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors w-5 h-5" />
                </div>

                {/* Quick Collections */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                    {['All Books', 'Reference', 'Textbooks', 'Novels', 'Magazine'].map((tag, i) => (
                        <button
                            key={tag}
                            className={cn(
                                "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all shadow-sm",
                                i === 0 ? "bg-sky-500 text-white shadow-sky-200" : "bg-white text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Resource Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MOCK_RESOURCES.map((book, i) => (
                        <motion.div
                            key={book.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="group overflow-hidden rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white/80 backdrop-blur-sm">
                                <CardContent className="p-5 flex gap-4">
                                    {/* Book "Spine" Color Box */}
                                    <div className={cn(
                                        "w-20 h-28 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform",
                                        book.color
                                    )}>
                                        <StudentPortalIcon icon={book.icon} size={40} />
                                    </div>

                                    <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                                        <div>
                                            <h3 className="font-black text-slate-800 text-base leading-tight truncate">
                                                {book.title}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 mt-1">{book.author}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-100 text-[10px] font-black px-2 py-0.5 rounded-full text-slate-500 uppercase">
                                                    {book.type}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-300">{book.size}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-sky-50 rounded-xl text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="pb-32" />
            </div>
        </div>
    );
};
