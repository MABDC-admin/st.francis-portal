import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ticketSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.enum(["hardware", "software", "network", "access", "other"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    pc_name: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export function CreateTicketDialog() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const { selectedSchool } = useSchool();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<TicketFormValues>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            title: "",
            description: "",
            category: "other",
            priority: "medium",
            pc_name: "",
        },
    });

    const onSubmit = async (values: TicketFormValues) => {
        if (!user || !selectedSchool) {
            toast.error("You must be logged in and have a school selected");
            return;
        }

        setIsSubmitting(true);
        try {
            let schoolId = null;

            const { data: schoolData } = await supabase
                .from("schools")
                .select("id")
                .ilike("name", `%${selectedSchool}%`)
                .limit(1)
                .maybeSingle();

            if (schoolData) {
                schoolId = schoolData.id;
            } else {
                const { data: fallbackSchool } = await supabase
                    .from("schools")
                    .select("id")
                    .limit(1)
                    .maybeSingle();

                if (fallbackSchool) {
                    schoolId = fallbackSchool.id;
                }
            }

            if (!schoolId) {
                toast.error("Could not resolve school ID. Please contact administrator.");
                setIsSubmitting(false);
                return;
            }

            const { error } = await supabase.from("helpdesk_tickets").insert({
                title: values.title,
                description: values.description,
                category: values.category,
                priority: values.priority,
                pc_name: values.pc_name || null,
                school_id: schoolId,
                created_by: user.id,
            });

            if (error) throw error;

            toast.success("Ticket created successfully");
            setOpen(false);
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["helpdesk-tickets"] });
        } catch (error: any) {
            console.error("Error creating ticket:", error);
            toast.error(error.message || "Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>
                        Describe your issue in detail. We'll get back to you as soon as possible.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brief summary of the issue" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="hardware">Hardware</SelectItem>
                                                <SelectItem value="software">Software</SelectItem>
                                                <SelectItem value="network">Network/Internet</SelectItem>
                                                <SelectItem value="access">Account/Access</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="pc_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>PC / Device Name (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. PC-LAB01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Please utilize specific details..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Ticket
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
