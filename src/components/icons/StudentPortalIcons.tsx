import React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface StudentPortalIconProps {
    icon: string;
    className?: string;
    size?: number | string;
}

export const StudentPortalIcon = ({ icon, className, size = 24 }: StudentPortalIconProps) => {
    return (
        <Icon
            icon={icon}
            className={cn("flex-shrink-0", className)}
            width={size}
            height={size}
        />
    );
};

// Reliable Iconify mapping (Using flat/3D-style variants)
export const STUDENT_ICONS = {
    // Navigation
    home: "fluent-emoji:house",
    timetable: "fluent-emoji:calendar",
    assignments: "fluent-emoji:check-mark-button",
    grades: "fluent-emoji:clipboard",
    library: "fluent-emoji:books",

    // Subjects (Fluent Emoji Flat/3D style)
    english: "fluent-emoji-flat:closed-book",
    math: "fluent-emoji-flat:abacus",
    science: "fluent-emoji-flat:test-tube",
    socialStudies: "fluent-emoji-flat:globe-with-meridians",
    filipino: "fluent-emoji-flat:fountain-pen",
    pe: "fluent-emoji-flat:whistle",
    mapeh: "fluent-emoji-flat:soccer-ball",
    ict: "fluent-emoji-flat:laptop",
    tle: "fluent-emoji-flat:hammer-and-wrench",
    esp: "fluent-emoji-flat:shining-heart",
    research: "fluent-emoji-flat:magnifying-glass-tilted-left",
    motherTongue: "fluent-emoji-flat:speaking-head",

    // Navigation & Footer
    homework: "fluent-emoji-flat:clipboard",
    upcomingTests: "fluent-emoji-flat:memo",
    events: "fluent-emoji-flat:calendar",

    // Status/Indicators
    completed: "fluent-emoji-flat:check-mark-button",
    motivation: "fluent-emoji-flat:smiling-face-with-smiling-eyes",
};
