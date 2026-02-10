import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { AttachmentUpload } from "@/components/helpdesk/AttachmentUpload";
import { AttachmentList } from "@/components/helpdesk/AttachmentList";

// Workaround for type inference issues
type TicketDetailType = Database["public"]["Tables"]["helpdesk_tickets"]["Row"] & {
    creator: { email: string | null } | null;
    assignee: { email: string | null } | null;
};

type TicketCommentType = Database["public"]["Tables"]["helpdesk_comments"]["Row"] & {
    author: { email: string | null } | null;
};

export default function TicketDetail() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const queryClient = useQueryClient();
    const [newComment, setNewComment] = useState("");

    const { data: ticket, isLoading: isLoadingTicket } = useQuery({
        queryKey: ["helpdesk-ticket", ticketId],
        queryFn: async () => {
            if (!ticketId) throw new Error("No ticket ID");
            const { data, error } = await supabase
                .from("helpdesk_tickets")
                .select(`
          *,
          creator:created_by (
            email
          ),
          assignee:assigned_to (
            email
          )
        `)
                .eq("id", ticketId)
                .single();

            if (error) throw error;
            // Force cast to match our expected type, since Supabase types are sometimes tricky with manual joins
            return data as unknown as TicketDetailType;
        },
        enabled: !!ticketId,
    });

    const { data: attachments, refetch: refetchAttachments } = useQuery({
        queryKey: ["helpdesk-attachments", ticketId],
        queryFn: async () => {
            if (!ticketId) throw new Error("No ticket ID");
            const { data, error } = await supabase
                .from("helpdesk_attachments")
                .select("*")
                .eq("ticket_id", ticketId);
            if (error) throw error;
            return data;
        },
        enabled: !!ticketId
    });

    const { data: comments, isLoading: isLoadingComments } = useQuery({
        queryKey: ["helpdesk-comments", ticketId],
        queryFn: async () => {
            if (!ticketId) throw new Error("No ticket ID");
            const { data, error } = await supabase
                .from("helpdesk_comments")
                .select(`
          *,
          author:user_id (
            email
          )
        `)
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data as unknown as TicketCommentType[];
        },
        enabled: !!ticketId,
    });

    const addCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!user) throw new Error("Not authenticated");
            const { error } = await supabase.from("helpdesk_comments").insert({
                ticket_id: ticketId!,
                user_id: user.id,
                content,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setNewComment("");
            queryClient.invalidateQueries({ queryKey: ["helpdesk-comments", ticketId] });
            toast.success("Comment added");
        },
        onError: (error) => {
            toast.error("Failed to add comment: " + error.message);
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: Database["public"]["Tables"]["helpdesk_tickets"]["Row"]["status"]) => {
            const { error } = await supabase
                .from("helpdesk_tickets")
                .update({ status })
                .eq("id", ticketId!);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["helpdesk-ticket", ticketId] });
            toast.success("Status updated");
        },
        onError: (error) => {
            toast.error("Failed to update status: " + error.message);
        },
    });

    const updatePriorityMutation = useMutation({
        mutationFn: async (priority: Database["public"]["Tables"]["helpdesk_tickets"]["Row"]["priority"]) => {
            const { error } = await supabase
                .from("helpdesk_tickets")
                .update({ priority })
                .eq("id", ticketId!);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["helpdesk-ticket", ticketId] });
            toast.success("Priority updated");
        },
        onError: (error) => {
            toast.error("Failed to update priority: " + error.message);
        },
    });


    if (isLoadingTicket) {
        return <div className="p-8 text-center">Loading ticket details...</div>;
    }

    if (!ticket) {
        return <div className="p-8 text-center">Ticket not found</div>;
    }

    const isAdmin = role === 'admin';

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-5xl">
            <Button variant="ghost" onClick={() => navigate("/", { state: { activeTab: 'helpdesk' } })} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold">{ticket.title}</h1>
                                    <div className="text-sm text-muted-foreground mt-2">
                                        Opened by {ticket.creator?.email} on {format(new Date(ticket.created_at), "PPP p")}
                                    </div>
                                </div>
                                <Badge variant={
                                    ticket.status === 'open' ? 'default' :
                                        ticket.status === 'in_progress' ? 'secondary' :
                                            ticket.status === 'resolved' ? 'outline' : 'outline'
                                }>
                                    {ticket.status.replace("_", " ").toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{ticket.description}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Activity</h3>
                        {comments?.map((comment) => (
                            <Card key={comment.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-sm">{comment.author?.email}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), "PPP p")}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                </CardContent>
                            </Card>
                        ))}

                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <Textarea
                                    placeholder="Add a reply..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => addCommentMutation.mutate(newComment)}
                                        disabled={!newComment.trim() || addCommentMutation.isPending}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Post Reply
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Ticket Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">Status</span>
                                {isAdmin ? (
                                    <Select
                                        defaultValue={ticket.status}
                                        onValueChange={(val: any) => updateStatusMutation.mutate(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="font-medium capitalize">{ticket.status.replace("_", " ")}</div>
                                )}
                            </div>

                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">Priority</span>
                                {isAdmin ? (
                                    <Select
                                        defaultValue={ticket.priority}
                                        onValueChange={(val: any) => updatePriorityMutation.mutate(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="font-medium capitalize">{ticket.priority}</div>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">Category</span>
                                <div className="font-medium capitalize">{ticket.category}</div>
                            </div>

                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">Assignee</span>
                                <div className="font-medium">{ticket.assignee?.email || "Unassigned"}</div>
                                {/* Admin can assign here later */}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Attachments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <AttachmentUpload
                                ticketId={ticketId}
                                onUploadComplete={refetchAttachments}
                            />
                            <AttachmentList attachments={attachments || []} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
