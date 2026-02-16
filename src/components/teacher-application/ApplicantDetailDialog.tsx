import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap,
  FileText, CheckCircle, XCircle, Clock, User, printer as Printer,
  Download, ExternalLink, Send
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PrintableApplicantCV } from './PrintableApplicantCV';

const STATUS_FLOW = ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'demo_teaching', 'approved', 'hired'];
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', under_review: 'Under Review', shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview', demo_teaching: 'Demo Teaching', approved: 'Approved',
  rejected: 'Rejected', hired: 'Hired',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800', under_review: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-purple-100 text-purple-800', interview_scheduled: 'bg-indigo-100 text-indigo-800',
  demo_teaching: 'bg-cyan-100 text-cyan-800', approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800', hired: 'bg-emerald-100 text-emerald-800',
};

interface Props {
  application: any;
  open: boolean;
  onClose: () => void;
  onStatusChange: (status: string, reason?: string) => void;
}

export const ApplicantDetailDialog = ({ application: app, open, onClose, onStatusChange }: Props) => {
  const [newStatus, setNewStatus] = useState(app.status);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showInterview, setShowInterview] = useState(false);

  // Interview Form State
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState('Online');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [sengingEmail, setSendingEmail] = useState(false);

  const handleQuickStatus = (status: string) => {
    if (status === 'rejected') {
      setShowReject(true);
      setNewStatus('rejected');
    } else if (status === 'interview_scheduled') {
      setShowInterview(true);
    } else {
      onStatusChange(status);
      onClose();
    }
  };

  const handleSendInterview = async () => {
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-interview-invitation', {
        body: {
          applicationId: app.id,
          applicantEmail: app.email,
          applicantName: `${app.first_name} ${app.last_name}`,
          interviewDate,
          interviewTime,
          interviewType,
          meetingLink,
          location,
          notes
        }
      });

      if (error) throw error;

      toast.success('Interview invitation sent successfully!');
      onStatusChange('interview_scheduled');
      setShowInterview(false);
      onClose();
    } catch (error: any) {
      console.error('Failed to send interview email:', error);
      toast.error('Failed to send email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };


  const SidebarItem = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 text-sm">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="font-medium text-foreground">{value}</p>
        </div>
      </div>
    );
  };

  const DocumentLink = ({ label, url }: { label: string, url?: string }) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
      >
        <FileText className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium flex-1">{label}</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-start justify-between bg-muted/10">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              {app.photo_url ? (
                <img src={app.photo_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary/50" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {app.first_name} {app.middle_name} {app.last_name} {app.suffix}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-sm font-normal">
                  {app.position_applied}
                </Badge>
                <Badge className={STATUS_COLORS[app.status]}>
                  {STATUS_LABELS[app.status]}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono ml-2">
                  {app.reference_number}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setTimeout(() => window.print(), 100)}>
              <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
            </Button>
            {/* Quick Actions based on status */}
            {['submitted', 'under_review'].includes(app.status) && (
              <>
                <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => handleQuickStatus('shortlisted')}>
                  Shortlist
                </Button>
                <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleQuickStatus('interview_scheduled')}>
                  Schedule Interview
                </Button>
              </>
            )}
            {app.status === 'shortlisted' && (
              <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleQuickStatus('interview_scheduled')}>
                Schedule Interview
              </Button>
            )}
            {app.status === 'interview_scheduled' && (
              <Button size="sm" variant="default" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => handleQuickStatus('demo_teaching')}>
                Move to Demo
              </Button>
            )}
            {/* Always allow reject if not already rejected/hired */}
            {!['rejected', 'hired'].includes(app.status) && (
              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleQuickStatus('rejected')}>
                Reject
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            {/* Left Sidebar - Contact & Personal */}
            <div className="md:col-span-4 bg-muted/30 p-6 space-y-6 border-r h-full overflow-y-auto">
              {/* ... (Existing Sidebar Content) ... */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" /> Personal Details
                </h3>
                <div className="space-y-3">
                  <SidebarItem icon={Mail} label="Email" value={app.email} />
                  <SidebarItem icon={Phone} label="Mobile" value={app.mobile_number} />
                  <SidebarItem icon={MapPin} label="Address" value={`${app.house_street}, ${app.barangay}, ${app.city_municipality}`} />
                  <SidebarItem icon={Calendar} label="Date of Birth" value={format(new Date(app.date_of_birth), 'MMMM d, yyyy')} />
                  <SidebarItem icon={User} label="Civil Status" value={app.civil_status} />
                  <SidebarItem icon={Briefcase} label="Preferred Level" value={app.preferred_level} />
                </div>
              </div>

              <Separator />

              {app.has_prc_license && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4" /> Professional License
                  </h3>
                  <div className="p-3 bg-background rounded-lg border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">License #</span>
                      <span className="font-mono font-medium">{app.prc_license_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <span>{app.prc_expiration_date}</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documents
                </h3>
                <div className="space-y-1">
                  <DocumentLink label="Resume / CV" url={app.resume_url} />
                  <DocumentLink label="Transcript of Records" url={app.transcript_url} />
                  <DocumentLink label="Diploma" url={app.diploma_url} />
                  <DocumentLink label="Valid ID" url={app.valid_id_url} />
                  {app.certificates_url?.map((url: string, i: number) => (
                    <DocumentLink key={i} label={`Certificate ${i + 1}`} url={url} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content - Experience & Education */}
            <div className="md:col-span-8 p-6 space-y-8 overflow-y-auto h-full">

              {/* Experience Section */}
              <section>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                  <Briefcase className="w-5 h-5" /> Work Experience
                </h3>
                <div className="space-y-6">
                  {app.has_experience && (app.experience as any[])?.length > 0 ? (
                    (app.experience as any[]).map((exp, i) => (
                      <div key={i} className="relative pl-6 border-l-2 border-primary/20 last:border-0">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-primary" />
                        <div className="mb-1">
                          <h4 className="font-bold text-base">{exp.position}</h4>
                          <p className="text-sm text-muted-foreground">{exp.school}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {exp.start_date} — {exp.end_date || 'Present'}
                        </p>
                        <Badge variant="secondary" className="text-xs font-normal">
                          Subject: {exp.subjects}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic text-sm">No confirmed work experience listed.</p>
                  )}
                </div>
              </section>

              <Separator />

              {/* Education Section */}
              <section>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                  <GraduationCap className="w-5 h-5" /> Education
                </h3>
                <div className="space-y-4">
                  {(app.education as any[])?.map((edu, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/20 border">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold">{edu.course} {edu.major && <span className="text-muted-foreground font-normal">in {edu.major}</span>}</h4>
                        <p className="text-sm">{edu.school}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Graduated: {edu.year_graduated}</span>
                          {edu.honors && (
                            <Badge variant="outline" className="text-xs py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Award className="w-3 h-3 mr-1" /> {edu.honors}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Essays */}
              <section className="grid gap-6">
                {app.why_join && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Why do you want to join us?</h3>
                    <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg italic">
                      "{app.why_join}"
                    </p>
                  </div>
                )}
                {app.teaching_philosophy && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Teaching Philosophy</h3>
                    <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg italic">
                      "{app.teaching_philosophy}"
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t bg-background flex justify-between sm:justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                {[...STATUS_FLOW, 'rejected'].map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => onStatusChange(newStatus)} disabled={newStatus === app.status}>
              Update
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>

        {/* Rejection Dialog */}
        {showReject && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border shadow-lg rounded-lg max-w-md w-full p-6 space-y-4">
              <h3 className="font-bold text-lg text-destructive">Reject Application</h3>
              <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this application. This may be sent to the applicant.</p>
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => {
                  onStatusChange('rejected', rejectionReason);
                  setNewStatus('rejected');
                  setShowReject(false);
                  onClose();
                }}>Confirm Rejection</Button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Scheduler Dialog */}
        {showInterview && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border shadow-lg rounded-lg max-w-lg w-full p-6 space-y-4 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Schedule Interview
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowInterview(false)}>
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Time <span className="text-destructive">*</span></Label>
                  <Input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interview Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Online">Online (Google Meet/Zoom)</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {interviewType === 'Online' ? (
                <div className="space-y-2">
                  <Label>Meeting Link</Label>
                  <Input placeholder="https://meet.google.com/..." value={meetingLink} onChange={e => setMeetingLink(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Location / Room</Label>
                  <Input placeholder="e.g. Principal's Office" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any specific instructions for the applicant..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowInterview(false)}>Cancel</Button>
                <Button onClick={handleSendInterview} disabled={sengingEmail || !interviewDate || !interviewTime}>
                  {sengingEmail ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Send Invitation & Update Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      <PrintableApplicantCV application={app} />
    </Dialog>
  );
};
