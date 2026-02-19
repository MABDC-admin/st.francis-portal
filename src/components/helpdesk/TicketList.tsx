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
import type { HelpdeskTicket } from "@/pages/Helpdesk/index";

interface TicketListProps {
    tickets: HelpdeskTicket[];
    isLoading: boolean;
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "urgent":
        case "high":
            return "destructive";
        case "medium":
            return "default";
        case "low":
            return "secondary";
        default:
            return "outline";
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "open":
            return "default";
        case "in_progress":
            return "secondary";
        case "resolved":
        case "closed":
            return "outline";
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
                        <TableHead className="hidden md:table-cell">Requester</TableHead>
                        <TableHead className="hidden lg:table-cell">PC Name</TableHead>
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
                                    {ticket.requester_name || "Unknown"} · {ticket.created_at ? format(new Date(ticket.created_at), "MMM d, yyyy") : "N/A"}
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {ticket.requester_name || "Unknown"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                                {ticket.pc_name || "—"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell capitalize">
                                {ticket.category}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {ticket.created_at ? format(new Date(ticket.created_at), "MMM d, yyyy") : "N/A"}
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
