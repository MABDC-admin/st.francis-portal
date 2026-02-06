import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentSchedule } from '@/hooks/useStudentPortalData';
import { DAY_NAMES, WEEKDAY_NAMES } from '@/types/studentPortal';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentScheduleTabProps {
  gradeLevel: string;
  schoolId: string;
  academicYearId: string;
}

export const StudentScheduleTab = ({
  gradeLevel,
  schoolId,
  academicYearId,
}: StudentScheduleTabProps) => {
  const { data: schedules, byDay, isLoading } = useStudentSchedule(
    gradeLevel,
    schoolId,
    academicYearId
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No class schedules available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Get current day for highlighting
  const today = new Date().getDay();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Weekly Class Schedule</h2>
        <Badge variant="outline">{gradeLevel}</Badge>
      </div>

      {/* Weekdays only (1-5: Monday to Friday) */}
      {[1, 2, 3, 4, 5].map((dayNum) => {
        const daySchedules = byDay.get(dayNum) || [];
        const isToday = dayNum === today;

        return (
          <Card
            key={dayNum}
            className={isToday ? 'border-primary shadow-md' : ''}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {DAY_NAMES[dayNum]}
                {isToday && (
                  <Badge variant="default" className="text-xs">
                    Today
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground font-normal ml-auto">
                  {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {daySchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No classes scheduled</p>
              ) : (
                <div className="space-y-3">
                  {daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {/* Time */}
                      <div className="flex-shrink-0 text-center min-w-[80px]">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="h-3 w-3" />
                          {schedule.start_time?.slice(0, 5)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {schedule.end_time?.slice(0, 5)}
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="flex-1">
                        <p className="font-medium">{schedule.subjects?.name || 'Unknown Subject'}</p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.subjects?.code}
                        </p>
                      </div>

                      {/* Room & Teacher */}
                      <div className="flex-shrink-0 text-right text-sm">
                        {schedule.room && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {schedule.room}
                          </div>
                        )}
                        {schedule.teachers?.full_name && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            {schedule.teachers.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
