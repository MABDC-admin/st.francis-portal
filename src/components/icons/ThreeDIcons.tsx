import React from 'react';

export const StudentIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body/Torso */}
        <path d="M30 65 C30 65 30 55 50 55 C70 55 70 65 70 65 V90 H30 V65Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
        <path d="M50 55 V90" stroke="#1D4ED8" strokeWidth="1" opacity="0.5" />

        {/* Collar */}
        <path d="M40 55 L50 65 L60 55" fill="white" stroke="#E5E7EB" strokeWidth="2" />

        {/* Head */}
        <circle cx="50" cy="35" r="18" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />

        {/* Hair - Short Trim */}
        <path d="M32 30 C32 20 40 15 50 15 C60 15 68 20 68 30 V35 H32 V30Z" fill="#4B5563" stroke="#1F2937" strokeWidth="2" />

        {/* Smile */}
        <path d="M45 40 Q50 45 55 40" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />

        {/* BackPack Strap (optional detail) */}
        <path d="M35 60 L30 80" stroke="#1D4ED8" strokeWidth="3" opacity="0.3" />
        <path d="M65 60 L70 80" stroke="#1D4ED8" strokeWidth="3" opacity="0.3" />
    </svg>
);

export const TeacherIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Book 1 Bottom */}
        <path d="M20 60 L50 75 L80 60 V70 L50 85 L20 70 V60Z" fill="#059669" stroke="#047857" strokeWidth="2" />
        <path d="M20 60 L50 75 L80 60 L50 45 L20 60Z" fill="#10B981" stroke="#047857" strokeWidth="2" />

        {/* Book 2 Middle */}
        <path d="M20 45 L50 60 L80 45 V55 L50 70 L20 55 V45Z" fill="#D97706" stroke="#B45309" strokeWidth="2" />
        <path d="M20 45 L50 60 L80 45 L50 30 L20 45Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />

        {/* Book 3 Top */}
        <path d="M25 30 L50 42 L75 30 V38 L50 50 L25 38 V30Z" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" />
        <path d="M25 30 L50 42 L75 30 L50 18 L25 30Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="2" />

        {/* Apple */}
        <circle cx="50" cy="20" r="8" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
        <path d="M50 12 L55 5" stroke="#4B5563" strokeWidth="2" />
    </svg>
);

export const ClassesIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Building Base */}
        <path d="M10 50 L50 70 L90 50" fill="#FCD34D" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 50 V80 L50 100 V70" fill="#F59E0B" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
        <path d="M90 50 V80 L50 100 V70" fill="#D97706" stroke="#92400E" strokeWidth="2" strokeLinejoin="round" />

        {/* Roof */}
        <path d="M50 10 L95 45 L50 55 L5 45 L50 10Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" strokeLinejoin="round" />
        <path d="M50 10 L50 55" stroke="#B91C1C" strokeWidth="1" />

        {/* Clock */}
        <circle cx="50" cy="35" r="5" fill="white" stroke="#B91C1C" />
        <path d="M50 35 L50 33 M50 35 L52 35" stroke="black" strokeWidth="1" />

        {/* Door */}
        <rect x="42" y="75" width="16" height="20" fill="#78350F" transform="skewY(10)" />
    </svg>
);

export const AttendanceIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Clipboard Board */}
        <path d="M20 20 L80 20 L80 80 L20 80 Z" fill="#D97706" transform="translate(0, 10) skewX(-10)" stroke="#92400E" strokeWidth="2" />
        {/* Paper */}
        <path d="M25 25 L75 25 L75 75 L25 75 Z" fill="white" transform="translate(0, 10) skewX(-10)" stroke="#E5E7EB" strokeWidth="1" />

        {/* Clip */}
        <path d="M40 15 L60 15 L60 25 L40 25 Z" fill="#9CA3AF" transform="translate(0, 10) skewX(-10)" />

        {/* Checkmark */}
        <path d="M35 50 L45 60 L65 40" stroke="#10B981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(0, 10) skewX(-10)" />
    </svg>
);

export const AdmitStudentIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Reuse Student Cap base but smaller to make room for plus */}
        <g transform="translate(-10, 5) scale(0.9)">
            <path d="M50 20 L85 40 L50 60 L15 40 L50 20Z" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
            <path d="M85 40 V55 L50 75 V60 L85 40Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round" />
            <path d="M15 40 V55 L50 75 V60 L15 40Z" fill="#1D4ED8" stroke="#1E40AF" strokeWidth="2" strokeLinejoin="round" />
            <path d="M50 40 L65 55 L65 70" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="40" r="3" fill="#F59E0B" />
        </g>

        {/* Plus Badge */}
        <circle cx="75" cy="75" r="18" fill="#10B981" stroke="#047857" strokeWidth="2" />
        <path d="M75 65 V85 M65 75 H85" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const AddTeacherIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Reuse Teacher Books base */}
        <g transform="translate(-10, 5) scale(0.9)">
            <path d="M20 60 L50 75 L80 60 V70 L50 85 L20 70 V60Z" fill="#059669" stroke="#047857" strokeWidth="2" />
            <path d="M20 60 L50 75 L80 60 L50 45 L20 60Z" fill="#10B981" stroke="#047857" strokeWidth="2" />
            <path d="M20 45 L50 60 L80 45 V55 L50 70 L20 55 V45Z" fill="#D97706" stroke="#B45309" strokeWidth="2" />
            <path d="M20 45 L50 60 L80 45 L50 30 L20 45Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <path d="M25 30 L50 42 L75 30 V38 L50 50 L25 38 V30Z" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" />
            <path d="M25 30 L50 42 L75 30 L50 18 L25 30Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="2" />
        </g>

        {/* Plus Badge */}
        <circle cx="75" cy="75" r="18" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
        <path d="M75 65 V85 M65 75 H85" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const ScheduleIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Calendar Page */}
        <path d="M20 30 L80 30 L80 90 L20 90 Z" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />

        {/* Header */}
        <path d="M20 30 L80 30 L80 45 L20 45 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />

        {/* Rings */}
        <path d="M35 20 V35" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <path d="M65 20 V35" stroke="#374151" strokeWidth="3" strokeLinecap="round" />

        {/* Grid Lines */}
        <path d="M30 55 L70 55" stroke="#9CA3AF" strokeWidth="2" />
        <path d="M30 65 L70 65" stroke="#9CA3AF" strokeWidth="2" />
        <path d="M30 75 L70 75" stroke="#9CA3AF" strokeWidth="2" />

        {/* Clock Overlay */}
        <circle cx="70" cy="75" r="15" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
        <path d="M70 75 L70 68 M70 75 L75 75" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const EnterGradeIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Spreadsheet/Paper */}
        <path d="M25 20 L75 20 L75 80 L25 80 Z" fill="#10B981" transform="skewY(-5)" stroke="#047857" strokeWidth="2" />

        {/* Cells */}
        <path d="M35 35 L65 35" stroke="white" strokeWidth="2" transform="skewY(-5)" />
        <path d="M35 45 L65 45" stroke="white" strokeWidth="2" transform="skewY(-5)" />
        <path d="M35 55 L65 55" stroke="white" strokeWidth="2" transform="skewY(-5)" />

        {/* A+ Grade */}
        <circle cx="65" cy="65" r="18" fill="white" stroke="#F59E0B" strokeWidth="2" />
        <text x="65" y="70" textAnchor="middle" fill="#D97706" fontSize="20" fontWeight="bold" fontFamily="sans-serif">A+</text>
    </svg>
);

export const HomeIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 45 L75 45 L75 85 L25 85 Z" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
        <path d="M42 65 L58 65 L58 85 L42 85 Z" fill="#78350F" stroke="#451A03" strokeWidth="2" />
        <path d="M50 15 L90 45 L10 45 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" strokeLinejoin="round" />
        <path d="M70 25 V35" stroke="#78350F" strokeWidth="6" />
        <circle cx="50" cy="35" r="6" fill="#60A5FA" stroke="#2563EB" strokeWidth="2" />
    </svg>
);

export const SubjectsIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 85 L50 75" stroke="#4B5563" strokeWidth="4" />
        <path d="M35 85 L65 85" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="45" r="25" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
        <path d="M40 35 Q50 30 60 40 T70 50" fill="none" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 45 Q40 55 50 60" fill="none" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="50" cy="45" rx="32" ry="8" stroke="#9CA3AF" strokeWidth="2" transform="rotate(-15 50 45)" fill="none" />
    </svg>
);

export const EventsIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 30 L80 30 L80 90 L20 90 Z" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
        <path d="M20 30 L80 30 L80 45 L20 45 Z" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2" />
        <path d="M35 20 V35" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <path d="M65 20 V35" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 55 L55 65 L65 65 L57 71 L60 81 L50 75 L40 81 L43 71 L35 65 L45 65 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
    </svg>
);

export const EnrollmentIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 25 L85 45 L50 65 L15 45 L50 25Z" fill="#10B981" stroke="#059669" strokeWidth="2" strokeLinejoin="round" />
        <path d="M85 45 V60 L50 80 V65 L85 45Z" fill="#059669" stroke="#047857" strokeWidth="2" strokeLinejoin="round" />
        <path d="M15 45 V60 L50 80 V65 L15 45Z" fill="#047857" stroke="#064E3B" strokeWidth="2" strokeLinejoin="round" />
        <path d="M50 45 L65 60 L65 75" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="45" r="3" fill="#F59E0B" />
    </svg>
);

export const ReportsIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 20 L70 20 L70 80 L30 80 Z" fill="white" stroke="#D1D5DB" strokeWidth="2" transform="rotate(-5 50 50)" />
        <g transform="rotate(-5 50 50)">
            <rect x="35" y="55" width="8" height="20" fill="#3B82F6" />
            <rect x="46" y="45" width="8" height="30" fill="#10B981" />
            <rect x="57" y="35" width="8" height="40" fill="#F59E0B" />
        </g>
    </svg>
);

export const ImportIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 30 L70 30 L70 90 L30 90 Z" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
        <path d="M30 50 C30 40 40 35 50 35 C60 35 70 40 70 50" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="2" />
        <path d="M50 60 V40 M45 45 L50 40 L55 45" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const AdminIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 20 L80 30 V50 C80 70 50 90 50 90 C50 90 20 70 20 50 V30 L50 20Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2" strokeLinejoin="round" />
        <path d="M35 45 L65 45 M50 35 V55" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const ProfileIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="35" r="15" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
        <path d="M25 80 C25 65 35 55 50 55 C65 55 75 65 75 80 V85 H25 V80Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
    </svg>
);

export const LibraryIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bookshelf */}
        <rect x="15" y="25" width="70" height="55" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="2" rx="3" />
        
        {/* Books */}
        <rect x="22" y="32" width="10" height="40" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" rx="1" />
        <rect x="34" y="35" width="8" height="37" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" rx="1" />
        <rect x="44" y="30" width="12" height="42" fill="#10B981" stroke="#059669" strokeWidth="1" rx="1" />
        <rect x="58" y="33" width="9" height="39" fill="#F59E0B" stroke="#D97706" strokeWidth="1" rx="1" />
        <rect x="69" y="28" width="10" height="44" fill="#EC4899" stroke="#BE185D" strokeWidth="1" rx="1" />
        
        {/* Book spines details */}
        <line x1="27" y1="38" x2="27" y2="65" stroke="#FCA5A5" strokeWidth="1" />
        <line x1="50" y1="36" x2="50" y2="66" stroke="#34D399" strokeWidth="1" />
        <line x1="74" y1="34" x2="74" y2="66" stroke="#F9A8D4" strokeWidth="1" />
    </svg>
);

export const CanvaIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Canvas/Easel base */}
        <path d="M50 85 L30 95 M50 85 L70 95" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
        <rect x="15" y="15" width="70" height="65" rx="4" fill="white" stroke="#D1D5DB" strokeWidth="2" />
        
        {/* Color palette circles */}
        <circle cx="30" cy="35" r="8" fill="#EF4444" />
        <circle cx="50" cy="30" r="8" fill="#F59E0B" />
        <circle cx="70" cy="35" r="8" fill="#10B981" />
        <circle cx="35" cy="55" r="8" fill="#3B82F6" />
        <circle cx="55" cy="60" r="8" fill="#8B5CF6" />
        <circle cx="70" cy="55" r="8" fill="#EC4899" />
        
        {/* Paintbrush */}
        <path d="M75 20 L85 10" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        <path d="M78 17 L82 25 L75 22 Z" fill="#F59E0B" />
    </svg>
);

export const NotebookIcon3D = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Notebook body */}
        <rect x="20" y="15" width="60" height="70" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
        
        {/* Spiral binding */}
        <circle cx="20" cy="25" r="3" fill="#374151" />
        <circle cx="20" cy="40" r="3" fill="#374151" />
        <circle cx="20" cy="55" r="3" fill="#374151" />
        <circle cx="20" cy="70" r="3" fill="#374151" />
        
        {/* Page lines */}
        <line x1="30" y1="30" x2="70" y2="30" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="30" y1="42" x2="70" y2="42" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="30" y1="54" x2="70" y2="54" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="30" y1="66" x2="55" y2="66" stroke="white" strokeWidth="2" opacity="0.6" />
        
        {/* AI/Brain icon */}
        <circle cx="72" cy="72" r="16" fill="#10B981" stroke="#059669" strokeWidth="2" />
        <path d="M65 72 C65 68 68 65 72 65 C76 65 79 68 79 72 C79 76 76 79 72 79 C68 79 65 76 65 72" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="69" cy="70" r="1.5" fill="white" />
        <circle cx="75" cy="70" r="1.5" fill="white" />
        <path d="M69 75 Q72 78 75 75" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
);
