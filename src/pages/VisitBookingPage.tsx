import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, isWeekend, startOfDay, differenceInCalendarDays } from 'date-fns';
import { CheckCircle2, Loader2, Sun, Cloud, GraduationCap, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const MAX_PER_SLOT = 5;

const VisitBookingPage = () => {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorStudentName, setVisitorStudentName] = useState('');
  const [visitorLevel, setVisitorLevel] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorAddress, setVisitorAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: school, error } = await supabase
          .from('schools')
          .select('id, name')
          .limit(1)
          .single();
        if (error || !school) throw new Error('Unable to load school information');
        setSchoolId(school.id);
      } catch (e: any) {
        setLoadError(e.message || 'Failed to load');
      } finally {
        setIsLoadingSchool(false);
      }
    };
    load();
  }, []);

  const { data: existingVisits = [] } = useQuery({
    queryKey: ['visit-booking-slots', schoolId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('school_visits') as any)
        .select('visit_date, visit_slot')
        .eq('school_id', schoolId)
        .eq('status', 'scheduled')
        .gte('visit_date', format(today, 'yyyy-MM-dd'));
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });

  const slotCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    existingVisits.forEach((v: any) => {
      if (!counts[v.visit_date]) counts[v.visit_date] = {};
      counts[v.visit_date][v.visit_slot] = (counts[v.visit_date][v.visit_slot] || 0) + 1;
    });
    return counts;
  }, [existingVisits]);

  const getSlotCount = (date: string, slot: string) => slotCounts[date]?.[slot] || 0;
  const isSlotFull = (date: string, slot: string) => getSlotCount(date, slot) >= MAX_PER_SLOT;

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !visitorName.trim() || !schoolId) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from('school_visits') as any).insert([{
        school_id: schoolId,
        visitor_name: visitorName.trim(),
        visitor_student_name: visitorStudentName.trim() || null,
        visitor_level: visitorLevel.trim() || null,
        visitor_email: visitorEmail.trim() || null,
        visitor_phone: visitorPhone.trim() || null,
        visitor_address: visitorAddress.trim() || null,
        visit_date: formattedDate,
        visit_slot: selectedSlot,
        status: 'scheduled',
      }]);
      if (error) throw error;
      setIsBooked(true);
      toast.success('Visit scheduled successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to schedule visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSchool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError || !schoolId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-destructive">Visit Booking Unavailable</h2>
          <p className="text-muted-foreground">{loadError || 'Could not load page.'}</p>
        </div>
      </div>
    );
  }

  if (isBooked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md text-center space-y-5">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
          <h3 className="text-2xl font-bold text-foreground">Visit Scheduled!</h3>
          <div className="text-left bg-card rounded-lg p-5 space-y-2 text-sm shadow-md border">
            <p><span className="font-medium text-muted-foreground">Visitor:</span> <span className="text-foreground">{visitorName}</span></p>
            {visitorStudentName && <p><span className="font-medium text-muted-foreground">Student:</span> <span className="text-foreground">{visitorStudentName}</span></p>}
            {visitorLevel && <p><span className="font-medium text-muted-foreground">Grade Level:</span> <span className="text-foreground">{visitorLevel}</span></p>}
            {visitorEmail && <p><span className="font-medium text-muted-foreground">Email:</span> <span className="text-foreground">{visitorEmail}</span></p>}
            {visitorPhone && <p><span className="font-medium text-muted-foreground">Phone:</span> <span className="text-foreground">{visitorPhone}</span></p>}
            {visitorAddress && <p><span className="font-medium text-muted-foreground">Address:</span> <span className="text-foreground">{visitorAddress}</span></p>}
            <p><span className="font-medium text-muted-foreground">Date:</span> <span className="text-foreground">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span></p>
            <p><span className="font-medium text-muted-foreground">Time:</span> <span className="text-foreground">{selectedSlot === 'morning' ? '9:00 AM - 12:00 PM' : '1:00 PM - 4:00 PM'}</span></p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-4 text-center shadow-md">
        <div className="flex items-center justify-center gap-2 mb-1">
          <GraduationCap className="h-7 w-7" />
          <h1 className="text-xl font-bold">St. Francis Xavier Smart Academy</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">Schedule a School Visit</p>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-10">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setSelectedSlot(''); }}
            disabled={(date) => isWeekend(date) || date < today || date > maxDate}
            className="rounded-md border pointer-events-auto bg-card"
          />
        </div>

        {/* Slot Selection */}
        {selectedDate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
            {['morning', 'afternoon'].map((slot) => {
              const full = isSlotFull(formattedDate, slot);
              const count = getSlotCount(formattedDate, slot);
              const remaining = MAX_PER_SLOT - count;
              const isSelected = selectedSlot === slot;
              return (
                <Card
                  key={slot}
                  className={`cursor-pointer transition-all ${full ? 'opacity-50 cursor-not-allowed' : ''} ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                  onClick={() => !full && setSelectedSlot(slot)}
                >
                  <CardContent className="p-4 text-center space-y-1">
                    {slot === 'morning' ? <Sun className="h-5 w-5 mx-auto text-amber-500" /> : <Cloud className="h-5 w-5 mx-auto text-blue-500" />}
                    <p className="font-medium capitalize text-sm">{slot}</p>
                    <p className="text-xs text-muted-foreground">{slot === 'morning' ? '9:00 AM - 12:00 PM' : '1:00 PM - 4:00 PM'}</p>
                    <p className={`text-xs font-medium ${full ? 'text-destructive' : 'text-green-600'}`}>
                      {full ? 'Full' : `${remaining} slot${remaining !== 1 ? 's' : ''} left`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Visitor Form */}
        {selectedSlot && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h3 className="font-semibold text-foreground">Visitor Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Your Name <span className="text-destructive">*</span></Label>
                <Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Student Name</Label>
                <Input value={visitorStudentName} onChange={(e) => setVisitorStudentName(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <Input value={visitorLevel} onChange={(e) => setVisitorLevel(e.target.value)} placeholder="e.g. Grade 7" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={visitorAddress} onChange={(e) => setVisitorAddress(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
          </Button>
          {selectedSlot && (
            <Button onClick={handleBook} disabled={isSubmitting || !visitorName.trim()}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking...</> : 'Confirm Visit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitBookingPage;
