import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudentAssignments } from '@/hooks/useStudentPortalData';
import { ASSIGNMENT_TYPE_COLORS, type Assignment } from '@/types/studentPortal';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface StudentAssignmentsTabProps {
  studentId: string;
  gradeLevel: string;
  schoolId: string;
  academicYearId: string;
}

const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
  const dueDate = new Date(assignment.due_date);
  const isOverdue = isPast(dueDate) && (!assignment.submission || assignment.submission.status === 'pending');
  const typeColors = ASSIGNMENT_TYPE_COLORS[assignment.assignment_type];

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${typeColors.bg} ${typeColors.text} text-xs`}>
                {assignment.assignment_type}
              </Badge>
              {assignment.subjects && (
                <Badge variant="outline" className="text-xs">
                  {assignment.subjects.code}
                </Badge>
              )}
            </div>
            <h3 className="font-medium">{assignment.title}</h3>
            {assignment.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {assignment.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                <Clock className="h-4 w-4" />
                <span>
                  {isOverdue ? 'Overdue: ' : 'Due: '}
                  {format(dueDate, 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              {assignment.max_score && (
                <div className="text-muted-foreground">
                  Max: {assignment.max_score} pts
                </div>
              )}
            </div>
          </div>
          {assignment.submission && (
            <div className="text-right">
              <Badge
                variant={assignment.submission.status === 'graded' ? 'default' : 'secondary'}
              >
                {assignment.submission.status}
              </Badge>
              {assignment.submission.score !== null && (
                <p className="text-lg font-bold mt-1">
                  {assignment.submission.score}/{assignment.max_score}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const StudentAssignmentsTab = ({
  studentId,
  gradeLevel,
  schoolId,
  academicYearId,
}: StudentAssignmentsTabProps) => {
  const { pending, submitted, graded, overdue, isLoading } = useStudentAssignments(
    studentId,
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

  const hasNoAssignments = pending.length === 0 && submitted.length === 0 && graded.length === 0 && overdue.length === 0;

  if (hasNoAssignments) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No assignments available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{pending.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{overdue.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">{submitted.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{graded.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Graded</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different categories */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="pending" className="text-xs">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs">
            Overdue ({overdue.length})
          </TabsTrigger>
          <TabsTrigger value="submitted" className="text-xs">
            Submitted ({submitted.length})
          </TabsTrigger>
          <TabsTrigger value="graded" className="text-xs">
            Graded ({graded.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending assignments</p>
          ) : (
            pending.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-3 mt-4">
          {overdue.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No overdue assignments 🎉</p>
          ) : (
            overdue.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-3 mt-4">
          {submitted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No submitted assignments</p>
          ) : (
            submitted.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="graded" className="space-y-3 mt-4">
          {graded.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No graded assignments yet</p>
          ) : (
            graded.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
