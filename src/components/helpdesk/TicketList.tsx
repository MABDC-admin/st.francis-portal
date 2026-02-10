import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["helpdesk_tickets"]["Row"] & {
    creator?: { id?: string; email: string | null } | null;
    assignee?: { id?: string; email: string | null } | null;
};

interface TicketListProps {
    tickets: Ticket[];
    isLoading: boolean;
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "urgent":
            return "destructive";
        case "high":
            return "destructive"; // Or maybe orange if available, but destructive works for high attention
        case "medium":
            return "default"; // blue-ish usually
        case "low":
            return "secondary";
        default:
            return "outline";
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "open":
            return "default"; // blue
        case "in_progress":
            return "secondary"; // yellow/orange often implies work
        case "resolved":
            return "outline"; // green often implies done
        case "closed":
            return "outline"; // gray
        default:
            return "outline";
    }
};


export function TicketList({ tickets, isLoading }: TicketListProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return <div className="p-8 text-center">Loading tickets...</div>;
    }

    if (tickets.length === 0) {
        return (
            <div className="p-8 text-center border rounded-lg bg-muted/50">
                <h3 className="text-lg font-medium">No tickets found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    You haven't submitted any tickets yet, or none match your filters.
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px]">Priority</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/helpdesk/tickets/${ticket.id}`)}>
                            <TableCell>
                                <Badge variant={getStatusColor(ticket.status) as any}>
                                    {ticket.status.replace("_", " ")}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getPriorityColor(ticket.priority) as any}>
                                    {ticket.priority}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                                {ticket.title}
                                <div className="md:hidden text-xs text-muted-foreground mt-1">
                                    {format(new Date(ticket.created_at), "MMM d, yyyy")}
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell capitalize">
                                {ticket.category}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {format(new Date(ticket.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">View</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
