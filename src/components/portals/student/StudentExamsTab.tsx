import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExamSchedule } from '@/hooks/useStudentPortalData';
import { EXAM_TYPE_COLORS, type ExamSchedule } from '@/types/studentPortal';
import { GraduationCap, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays, differenceInHours, isPast } from 'date-fns';

interface StudentExamsTabProps {
  gradeLevel: string;
  schoolId: string;
  academicYearId: string;
}

const ExamCountdown = ({ examDate }: { examDate: string }) => {
  const date = new Date(examDate);
  const now = new Date();
  const daysUntil = differenceInDays(date, now);
  const hoursUntil = differenceInHours(date, now);

  if (isPast(date)) {
    return <Badge variant="secondary">Completed</Badge>;
  }

  if (daysUntil <= 0) {
    return (
      <Badge variant="destructive" className="animate-pulse">
        {hoursUntil <= 0 ? 'Now!' : `${hoursUntil}h left`}
      </Badge>
    );
  }

  if (daysUntil <= 3) {
    return (
      <Badge variant="destructive">
        {daysUntil} {daysUntil === 1 ? 'day' : 'days'} left
      </Badge>
    );
  }

  if (daysUntil <= 7) {
    return (
      <Badge className="bg-amber-100 text-amber-700">
        {daysUntil} days left
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      {daysUntil} days left
    </Badge>
  );
};

const ExamCard = ({ exam, showCountdown = true }: { exam: ExamSchedule; showCountdown?: boolean }) => {
  const typeColors = EXAM_TYPE_COLORS[exam.exam_type];
  const examDate = new Date(exam.exam_date);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${typeColors.bg} ${typeColors.text} text-xs`}>
                {exam.exam_type}
              </Badge>
              {exam.quarter && (
                <Badge variant="outline" className="text-xs">
                  Q{exam.quarter}
                </Badge>
              )}
              {exam.subjects && (
                <Badge variant="secondary" className="text-xs">
                  {exam.subjects.code}
                </Badge>
              )}
            </div>
            <h3 className="font-medium">{exam.subjects?.name || 'Exam'}</h3>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(examDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              {exam.start_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {exam.start_time.slice(0, 5)}
                    {exam.end_time && ` - ${exam.end_time.slice(0, 5)}`}
                  </span>
                </div>
              )}
              {exam.room && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{exam.room}</span>
                </div>
              )}
            </div>

            {exam.notes && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-muted/50 rounded text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{exam.notes}</span>
              </div>
            )}
          </div>

          {showCountdown && (
            <div className="flex-shrink-0">
              <ExamCountdown examDate={exam.exam_date} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const StudentExamsTab = ({
  gradeLevel,
  schoolId,
  academicYearId,
}: StudentExamsTabProps) => {
  const { upcoming, past, isLoading } = useExamSchedule(
    gradeLevel,
    schoolId,
    academicYearId
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const hasNoExams = upcoming.length === 0 && past.length === 0;

  if (hasNoExams) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No exam schedules available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Exams */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Upcoming Exams</h2>
          <Badge variant="default">{upcoming.length}</Badge>
        </div>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No upcoming exams 🎉</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>

      {/* Past Exams */}
      {past.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-muted-foreground">Past Exams</h2>
            <Badge variant="secondary">{past.length}</Badge>
          </div>

          <div className="space-y-3 opacity-75">
            {past.slice(0, 5).map((exam) => (
              <ExamCard key={exam.id} exam={exam} showCountdown={false} />
            ))}
            {past.length > 5 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                + {past.length - 5} more past exams
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
