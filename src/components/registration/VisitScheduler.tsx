import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, isWeekend, startOfDay } from 'date-fns';
import { CheckCircle2, Loader2, ArrowLeft, Sun, Cloud } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface VisitSchedulerProps {
  schoolId: string;
  registrationId?: string;
  onBack: () => void;
  onClose?: () => void;
}

export const VisitScheduler = ({ schoolId, registrationId, onBack, onClose }: VisitSchedulerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Fetch student registration details
  const { data: registration } = useQuery({
    queryKey: ['registration-details', registrationId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('online_registrations') as any)
        .select('student_name, current_address, phil_address')
        .eq('id', registrationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!registrationId,
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const maxPerSlot = 5;
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  // Fetch existing visits for capacity
  const { data: existingVisits = [] } = useQuery({
    queryKey: ['school-visits', schoolId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('school_visits') as any)
        .select('visit_date, visit_slot')
        .eq('school_id', schoolId)
        .eq('status', 'scheduled')
        .gte('visit_date', format(today, 'yyyy-MM-dd'));
      if (error) throw error;
      return data || [];
    },
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
  const isSlotFull = (date: string, slot: string) => getSlotCount(date, slot) >= maxPerSlot;

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const disabledDays = (date: Date) => {
    return isWeekend(date) || date < today || date > maxDate;
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !visitorName.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from('school_visits') as any).insert([{
        school_id: schoolId,
        registration_id: registrationId || null,
        visitor_name: visitorName.trim(),
        visitor_email: visitorEmail.trim() || null,
        visitor_phone: visitorPhone.trim() || null,
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

  useEffect(() => {
    if (!isBooked || !onClose) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [isBooked, onClose]);

  if (isBooked) {
    const address = registration?.current_address || registration?.phil_address;
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Visit Scheduled!</h3>
        <div className="text-left bg-muted rounded-lg p-4 space-y-2 text-sm">
          {registration?.student_name && (
            <p><span className="font-medium text-muted-foreground">Student:</span> <span className="text-foreground">{registration.student_name}</span></p>
          )}
          {address && (
            <p><span className="font-medium text-muted-foreground">Address:</span> <span className="text-foreground">{address}</span></p>
          )}
          <p><span className="font-medium text-muted-foreground">Visitor:</span> <span className="text-foreground">{visitorName}</span></p>
          {visitorEmail && <p><span className="font-medium text-muted-foreground">Email:</span> <span className="text-foreground">{visitorEmail}</span></p>}
          {visitorPhone && <p><span className="font-medium text-muted-foreground">Phone:</span> <span className="text-foreground">{visitorPhone}</span></p>}
          <p><span className="font-medium text-muted-foreground">Date:</span> <span className="text-foreground">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span></p>
          <p><span className="font-medium text-muted-foreground">Time:</span> <span className="text-foreground">{selectedSlot === 'morning' ? '9:00 AM - 12:00 PM' : '1:00 PM - 4:00 PM'}</span></p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Student Info */}
      {registration?.student_name && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 text-sm space-y-0.5">
            <p className="font-medium text-foreground">{registration.student_name}</p>
            {(registration.current_address || registration.phil_address) && (
              <p className="text-muted-foreground text-xs">{registration.current_address || registration.phil_address}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => { setSelectedDate(d); setSelectedSlot(''); }}
          disabled={disabledDays}
          className="rounded-md border"
        />
      </div>

      {/* Slot Selection */}
      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          {['morning', 'afternoon'].map((slot) => {
            const full = isSlotFull(formattedDate, slot);
            const count = getSlotCount(formattedDate, slot);
            const remaining = maxPerSlot - count;
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

      {/* Visitor Info */}
      {selectedSlot && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Your Name <span className="text-destructive">*</span></Label>
            <Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} placeholder="Optional" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {selectedSlot && (
          <Button onClick={handleBook} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking...</> : 'Confirm Visit'}
          </Button>
        )}
      </div>
    </div>
  );
};
