import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteTicketDialogProps {
    ticketId: string;
    ticketTitle: string;
}

export function DeleteTicketDialog({ ticketId, ticketTitle }: DeleteTicketDialogProps) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            // Delete comments first (FK constraint)
            await supabase.from("helpdesk_comments").delete().eq("ticket_id", ticketId);
            // Delete attachments
            await supabase.from("helpdesk_attachments").delete().eq("ticket_id", ticketId);
            // Delete the ticket
            const { error } = await supabase.from("helpdesk_tickets").delete().eq("id", ticketId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Ticket deleted");
            queryClient.invalidateQueries({ queryKey: ["helpdesk-tickets"] });
            navigate("/helpdesk");
        },
        onError: (error) => toast.error("Failed to delete: " + error.message),
    });

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{ticketTitle}"? This will also remove all comments and attachments. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => mutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
