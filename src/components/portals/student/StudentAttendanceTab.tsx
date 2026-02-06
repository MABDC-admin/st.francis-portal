import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentAttendance } from '@/hooks/useStudentPortalData';
import { ATTENDANCE_STATUS_COLORS } from '@/types/studentPortal';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StudentAttendanceTabProps {
  studentId: string;
  schoolId: string;
  academicYearId: string;
}

export const StudentAttendanceTab = ({
  studentId,
  schoolId,
  academicYearId,
}: StudentAttendanceTabProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: attendance, summary, isLoading } = useStudentAttendance(
    studentId,
    schoolId,
    academicYearId
  );

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, typeof attendance extends (infer T)[] ? T : never>();
    attendance?.forEach((record) => {
      map.set(record.date, record);
    });
    return map;
  }, [attendance]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statusIcons = {
    present: <CheckCircle className="h-4 w-4 text-green-500" />,
    absent: <XCircle className="h-4 w-4 text-red-500" />,
    late: <Clock className="h-4 w-4 text-amber-500" />,
    excused: <AlertCircle className="h-4 w-4 text-blue-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {summary?.percentage.toFixed(1) || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary?.present || 0}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summary?.absent || 0}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary?.late || 0}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary?.excused || 0}</p>
            <p className="text-xs text-muted-foreground">Excused</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Attendance
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for alignment */}
            {Array.from({ length: calendarDays[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const record = attendanceMap.get(dateStr);
              const dayIsToday = isToday(day);

              return (
                <div
                  key={dateStr}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                    ${dayIsToday ? 'ring-2 ring-primary' : ''}
                    ${record ? ATTENDANCE_STATUS_COLORS[record.status].bg : 'bg-muted/30'}
                  `}
                >
                  <span className={`font-medium ${dayIsToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {record && (
                    <span className="mt-0.5">{statusIcons[record.status]}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            {Object.entries(ATTENDANCE_STATUS_COLORS).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                <span className="capitalize">{status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {!attendance || attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No attendance records available.
            </p>
          ) : (
            <div className="space-y-2">
              {attendance.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {statusIcons[record.status]}
                    <div>
                      <p className="font-medium">{format(new Date(record.date), 'EEEE, MMMM d, yyyy')}</p>
                      {record.remarks && (
                        <p className="text-xs text-muted-foreground">{record.remarks}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${ATTENDANCE_STATUS_COLORS[record.status].bg} ${ATTENDANCE_STATUS_COLORS[record.status].text}`}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
