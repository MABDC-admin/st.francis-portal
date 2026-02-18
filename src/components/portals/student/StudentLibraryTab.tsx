import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StudentPortalIcon, STUDENT_ICONS } from '@/components/icons/StudentPortalIcons';
import { Search, BookOpen, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export const StudentLibraryTab = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Books');
    const { user } = useAuth();

    // Fetch student profile to get grade level
    const { data: studentProfile } = useQuery({
        queryKey: ['student-profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data: credential } = await supabase
                .from('user_credentials')
                .select('student_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!credential?.student_id) return null;

            const { data: student } = await supabase
                .from('students')
                .select('level, school_id')
                .eq('id', credential.student_id)
                .maybeSingle();

            return student;
        },
        enabled: !!user?.id
    });

    const studentGrade = useMemo(() => {
        if (!studentProfile?.level) return null;
        const normalized = studentProfile.level.toLowerCase();
        if (normalized.includes('kinder')) return 0;
        const match = normalized.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
    }, [studentProfile]);

    // Fetch books
    const { data: books = [], isLoading } = useQuery({
        queryKey: ['student-books', studentProfile?.school_id, studentGrade],
        queryFn: async () => {
            if (studentGrade === null) return [];

            let query = supabase.from('books')
                .select('*')
                .eq('is_active', true)
                .eq('is_teacher_only', false)
                .eq('grade_level', String(studentGrade));

            if (studentProfile?.school_id) {
                query = query.or(`school.eq.${studentProfile.school_id},school.is.null`);
            } else {
                query = query.is('school', null);
            }

            const { data, error } = await query.order('title');
            if (error) throw error;
            return data;
        },
        enabled: studentGrade !== null
    });

    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.subject?.toLowerCase().includes(searchQuery.toLowerCase());

            const bookAny = book as any;
            const matchesCategory = selectedCategory === 'All Books' ||
                (selectedCategory === 'Ebook' && bookAny.category === 'Ebook') ||
                (selectedCategory === 'Kids Stories' && bookAny.category === 'Kids Stories');

            return matchesSearch && matchesCategory;
        });
    }, [books, searchQuery, selectedCategory]);

    const categories = ['All Books', 'Ebook', 'Kids Stories'];

    const getSubjectIcon = (subject: string | null) => {
        if (!subject) return STUDENT_ICONS.library;
        const sub = subject.toLowerCase();
        if (sub.includes('math')) return STUDENT_ICONS.math;
        if (sub.includes('science')) return STUDENT_ICONS.science;
        if (sub.includes('english')) return STUDENT_ICONS.english;
        if (sub.includes('history') || sub.includes('social')) return STUDENT_ICONS.socialStudies;
        if (sub.includes('filipino')) return STUDENT_ICONS.filipino;
        if (sub.includes('ict') || sub.includes('computer')) return STUDENT_ICONS.ict;
        if (sub.includes('tle')) return STUDENT_ICONS.tle;
        return STUDENT_ICONS.library;
    };

    const getSubjectColor = (subject: string | null) => {
        if (!subject) return 'bg-slate-50 text-slate-500';
        const sub = subject.toLowerCase();
        if (sub.includes('math')) return 'bg-blue-50 text-blue-500';
        if (sub.includes('science')) return 'bg-purple-50 text-purple-500';
        if (sub.includes('english')) return 'bg-rose-50 text-rose-500';
        if (sub.includes('history') || sub.includes('social')) return 'bg-emerald-50 text-emerald-500';
        if (sub.includes('filipino')) return 'bg-amber-50 text-amber-500';
        return 'bg-sky-50 text-sky-500';
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFCF8] -m-4 sm:-m-0 rounded-t-[3rem] overflow-hidden">
            <div className="relative w-full overflow-hidden shrink-0">
                <img
                    src="/assets/library-header.png"
                    alt="Library"
                    className="w-full h-auto block"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FDFCF8] to-transparent" />
            </div>

            <div className="px-4 -mt-10 relative z-10 space-y-8">
                <div className="relative group">
                    <Input
                        placeholder="Search books, authors, or subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-[2rem] border-none bg-white shadow-lg focus:ring-2 focus:ring-sky-200 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors w-5 h-5" />
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all shadow-sm",
                                selectedCategory === cat ? "bg-sky-500 text-white shadow-sky-200" : "bg-white text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
                    </div>
                ) : filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredBooks.map((book: any, i) => (
                            <motion.div
                                key={book.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="group overflow-hidden rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white/80 backdrop-blur-sm">
                                    <CardContent className="p-5 flex gap-4">
                                        <div className={cn(
                                            "w-20 h-28 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform",
                                            getSubjectColor(book.subject)
                                        )}>
                                            <StudentPortalIcon icon={getSubjectIcon(book.subject)} size={40} />
                                        </div>

                                        <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                                            <div>
                                                <h3 className="font-black text-slate-800 text-base leading-tight truncate">
                                                    {book.title}
                                                </h3>
                                                <p className="text-xs font-bold text-slate-400 mt-1">{book.subject || 'Reference'}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px] font-black uppercase">
                                                        {book.category}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-slate-300">{book.page_count} Pages</span>
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
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <BookOpen className="h-16 w-16 text-slate-200 mb-4" />
                        <h3 className="text-lg font-black text-slate-400">Library is Empty</h3>
                        <p className="text-slate-300 font-bold max-w-[250px] mt-2">
                            Check back later for new books and learning materials!
                        </p>
                    </div>
                )}

                <div className="pb-32" />
            </div>
        </div>
    );
};
