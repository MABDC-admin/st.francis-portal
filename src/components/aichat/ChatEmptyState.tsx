import { FileText, Sparkles, Image as ImageIcon, Download, Code, GraduationCap, BookOpen } from 'lucide-react';

export const ChatEmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-70">
    <div className="relative">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>
      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
        <Sparkles className="h-3 w-3 text-primary-foreground" />
      </div>
    </div>
    <div>
      <p className="text-lg font-semibold text-foreground">SchoolAI — Your Genius Assistant</p>
      <p className="text-sm text-muted-foreground max-w-md mt-1">
        I can solve any homework, explain lessons step-by-step, write essays, generate quizzes, create lesson plans, debug code, and analyze documents.
      </p>
    </div>
    <div className="flex gap-2 flex-wrap justify-center max-w-lg">
      {[
        { icon: BookOpen, label: 'Homework Help' },
        { icon: FileText, label: 'Document Analysis' },
        { icon: Code, label: 'Code Assistant' },
        { icon: Sparkles, label: 'Lesson Planner' },
        { icon: ImageIcon, label: 'Image Generation' },
        { icon: Download, label: 'Save to PDF' },
      ].map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
          <Icon className="h-3 w-3" /> {label}
        </span>
      ))}
    </div>
  </div>
);
