import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, CalendarDays, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VisitScheduler } from './VisitScheduler';

interface SchoolShowcaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  registrationId?: string;
}

export const SchoolShowcaseDialog = ({ open, onOpenChange, schoolId, registrationId }: SchoolShowcaseDialogProps) => {
  const [showVisitScheduler, setShowVisitScheduler] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: schoolInfo } = useQuery({
    queryKey: ['school-info', schoolId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('school_info') as any)
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!schoolId,
  });

  const { data: school } = useQuery({
    queryKey: ['school-name', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('name, code').eq('id', schoolId).single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!schoolId,
  });

  const photos: string[] = (schoolInfo?.facility_photos as string[]) || [];
  const hasPhotos = photos.length > 0;

  const nextPhoto = () => setPhotoIndex((i) => (i + 1) % photos.length);
  const prevPhoto = () => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);

  if (showVisitScheduler) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Schedule a School Visit
            </DialogTitle>
          </DialogHeader>
          <VisitScheduler
            schoolId={schoolId}
            registrationId={registrationId}
            onBack={() => setShowVisitScheduler(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> {school?.name || 'School Information'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Photo Gallery */}
          {hasPhotos && (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              <AnimatePresence mode="wait">
                <motion.img
                  key={photoIndex}
                  src={photos[photoIndex]}
                  alt={`Facility ${photoIndex + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {photos.length > 1 && (
                <>
                  <Button size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80" onClick={prevPhoto}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80" onClick={nextPhoto}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Map */}
          {schoolInfo?.map_embed_url && (
            <div className="rounded-lg overflow-hidden border">
              <iframe
                src={schoolInfo.map_embed_url}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="School Location"
              />
            </div>
          )}

          {/* Registrar Info */}
          {schoolInfo?.registrar_name && (
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
              <Avatar className="h-14 w-14">
                {schoolInfo.registrar_photo_url && <AvatarImage src={schoolInfo.registrar_photo_url} />}
                <AvatarFallback className="text-lg">{schoolInfo.registrar_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">{schoolInfo.registrar_name}</p>
                <p className="text-xs text-muted-foreground">School Registrar</p>
                {schoolInfo.registrar_phone && (
                  <a href={`tel:${schoolInfo.registrar_phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {schoolInfo.registrar_phone}
                  </a>
                )}
                {schoolInfo.registrar_email && (
                  <a href={`mailto:${schoolInfo.registrar_email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {schoolInfo.registrar_email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Office Hours */}
          {schoolInfo?.office_hours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span><strong>Office Hours:</strong> {schoolInfo.office_hours}</span>
            </div>
          )}

          {/* No info fallback */}
          {!schoolInfo && (
            <div className="text-center py-6 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">School information is being updated. Please contact the school directly for more details.</p>
            </div>
          )}

          {/* Schedule Visit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowVisitScheduler(true)}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Schedule a School Visit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
