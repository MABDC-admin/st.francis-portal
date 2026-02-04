import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Edit2, Loader2, CalendarCheck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool, SchoolType } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SchoolEvent {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_type: 'holiday' | 'exam' | 'event' | 'meeting' | 'assembly' | 'general';
    school: string | null;
}

export const EventsManagement = () => {
    const { selectedSchool } = useSchool();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [syncYear, setSyncYear] = useState<number>(new Date().getFullYear() + 1);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_date: format(new Date(), "yyyy-MM-dd"),
        event_type: "general",
        school: (selectedSchool as SchoolType) || "MABDC",
    });

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            event_date: format(new Date(), "yyyy-MM-dd"),
            event_type: "general",
            school: (selectedSchool as SchoolType) || "MABDC",
        });
        setEditingEvent(null);
    };

    const handleEdit = (event: SchoolEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || "",
            event_date: event.event_date,
            event_type: event.event_type,
            school: (event.school as SchoolType) || "MABDC",
        });
        setIsDialogOpen(true);
    };

    // Fetch Events
    const { data: events = [], isLoading } = useQuery({
        queryKey: ["manage-school-events", selectedSchool, activeTab],
        queryFn: async () => {
            let query = supabase
                .from("school_events")
                .select("*")
                .order("event_date", { ascending: true });

            if (activeTab === "holidays") {
                query = query.eq("event_type", "holiday");
            } else if (activeTab === "school") {
                query = query.neq("event_type", "holiday");
            }

            // If viewing "All" tab in a specific school context, perhaps we filter?
            // For this management page, let's show ALL events but allow filtering by the school column visually
            // or filter strictly if the user wants. 
            // Let's filter by the selected school to keep context clear, but include shared (null school)

            const { data, error } = await query;
            if (error) throw error;

            // Filter in memory for school context if needed or handle via query
            return data as SchoolEvent[];
        },
    });

    // Filter events based on the currently selected school in the context stats
    const filteredEvents = events.filter(e =>
        e.school === selectedSchool || e.school === null
    );

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (newEvent: any) => {
            const { error } = await supabase.from("school_events").insert([newEvent]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage-school-events"] });
            toast({ title: "Success", description: "Event created successfully" });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedEvent: any) => {
            const { error } = await supabase
                .from("school_events")
                .update(updatedEvent)
                .eq("id", editingEvent?.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage-school-events"] });
            toast({ title: "Success", description: "Event updated successfully" });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("school_events").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage-school-events"] });
            toast({ title: "Success", description: "Event deleted successfully" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData };

        if (editingEvent) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const syncHolidays = async () => {
        const { error } = await supabase.functions.invoke('sync-holidays', {
            body: { year: syncYear }
        });
        if (error) toast({ title: "Error", description: "Failed to sync holidays", variant: "destructive" });
        else {
            toast({ title: "Success", description: `Holidays for ${syncYear} synced successfully` });
            queryClient.invalidateQueries({ queryKey: ["manage-school-events"] });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                        <CalendarIcon className="h-8 w-8 text-primary" />
                        Events & Holidays
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage school calendar events and public holidays for {selectedSchool}.
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-card border rounded-md px-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Auto-Sync Year:</span>
                        <Input
                            type="number"
                            value={syncYear}
                            onChange={(e) => setSyncYear(parseInt(e.target.value))}
                            className="w-20 h-8 border-none focus-visible:ring-0 px-0 text-center"
                        />
                        <Button variant="ghost" size="sm" onClick={syncHolidays} className="h-8 w-8 p-0 text-amber-600">
                            <CalendarCheck className="h-4 w-4" />
                        </Button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                                <DialogDescription>
                                    Details for the calendar event.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Event Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="type">Event Type</Label>
                                    <Select
                                        value={formData.event_type}
                                        onValueChange={(val: any) => setFormData({ ...formData, event_type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="holiday">Holiday</SelectItem>
                                            <SelectItem value="event">General Event</SelectItem>
                                            <SelectItem value="exam">Exam</SelectItem>
                                            <SelectItem value="meeting">Meeting</SelectItem>
                                            <SelectItem value="assembly">Assembly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="school">School</Label>
                                    <Select
                                        value={formData.school}
                                        onValueChange={(val) => setFormData({ ...formData, school: val as SchoolType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select school" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MABDC">MABDC (UAE)</SelectItem>
                                            <SelectItem value="STFXSA">STFXSA (Philippines)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="desc">Description</Label>
                                    <Textarea
                                        id="desc"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {createMutation.isPending || updateMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : null}
                                        Save Event
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Calendar Events</CardTitle>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="holidays">Holidays</TabsTrigger>
                                <TabsTrigger value="school">School Events</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <CardDescription>
                        Viewing {filteredEvents.length} events for {selectedSchool}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>School</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                No events found for {selectedSchool}.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEvents.map((event) => (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {format(new Date(event.event_date), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{event.title}</span>
                                                        {event.description && (
                                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {event.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            event.event_type === 'holiday' ? "bg-red-100 text-red-800 hover:bg-red-200" :
                                                                event.event_type === 'exam' ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
                                                                    "bg-slate-100 text-slate-800"
                                                        }
                                                    >
                                                        {event.event_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        {event.school || "All"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(event)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => deleteMutation.mutate(event.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
