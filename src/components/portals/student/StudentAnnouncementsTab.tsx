import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnnouncements } from '@/hooks/useStudentPortalData';
import { PRIORITY_COLORS, type Announcement } from '@/types/studentPortal';
import { Megaphone, Pin, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';

interface StudentAnnouncementsTabProps {
  schoolId: string;
  gradeLevel: string;
}

const AnnouncementCard = ({ announcement, isPinned = false }: { announcement: Announcement; isPinned?: boolean }) => {
  const priorityColors = PRIORITY_COLORS[announcement.priority];
  const publishedDate = new Date(announcement.published_at);

  return (
    <Card className={`
      ${isPinned ? 'border-2 border-primary/50 shadow-md' : ''}
      ${priorityColors.border} hover:shadow-md transition-shadow
    `}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {isPinned && (
            <div className="flex-shrink-0">
              <Pin className="h-5 w-5 text-primary fill-primary" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {announcement.priority !== 'normal' && (
                <Badge className={`${priorityColors.bg} ${priorityColors.text} text-xs`}>
                  {announcement.priority}
                </Badge>
              )}
              {announcement.target_grade_levels && announcement.target_grade_levels.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {announcement.target_grade_levels.join(', ')}
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-lg">{announcement.title}</h3>
            
            <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">
              {announcement.content}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(publishedDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(publishedDate, { addSuffix: true })}</span>
              </div>
              {announcement.expires_at && (
                <div className="flex items-center gap-1 text-amber-600">
                  <span>Expires: {format(new Date(announcement.expires_at), 'MMM d')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StudentAnnouncementsTab = ({
  schoolId,
  gradeLevel,
}: StudentAnnouncementsTabProps) => {
  const { pinned, regular, count, isLoading } = useAnnouncements(schoolId, gradeLevel);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (count === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No announcements at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Announcements</h2>
        <Badge variant="outline">{count} total</Badge>
      </div>

      {/* Pinned Announcements */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pinned</span>
          </div>
          {pinned.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isPinned
            />
          ))}
        </div>
      )}

      {/* Regular Announcements */}
      {regular.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Recent</span>
            </div>
          )}
          {regular.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
    </div>
  );
};
