import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { CreateTicketDialog } from "@/components/helpdesk/CreateTicketDialog";
import { TicketList } from "@/components/helpdesk/TicketList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle2, Clock, Inbox } from "lucide-react";

type TicketRow = Database["public"]["Tables"]["helpdesk_tickets"]["Row"];

export type HelpdeskTicket = TicketRow & {
    creator?: { id?: string; email: string | null } | null;
    assignee?: { id?: string; email: string | null } | null;
    requester_name?: string | null;
};

export default function HelpdeskIndex() {
    const { user, role } = useAuth();
    const [activeTab, setActiveTab] = useState("all");

    const { data: tickets, isLoading } = useQuery({
        queryKey: ["helpdesk-tickets", activeTab],
        queryFn: async () => {
            let query = supabase
                .from("helpdesk_tickets")
                .select(`
                    *,
                    creator:created_by ( id, email ),
                    assignee:assigned_to ( id, email )
                `)
                .order("created_at", { ascending: false });

            if (activeTab === "open") {
                query = query.in("status", ["open", "in_progress"]);
            } else if (activeTab === "resolved") {
                query = query.in("status", ["resolved", "closed"]);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as unknown as HelpdeskTicket[];
        },
        enabled: !!user,
    });

    // Fetch profiles for requester names
    const creatorIds = useMemo(() => {
        if (!tickets) return [];
        return [...new Set(tickets.map(t => t.created_by).filter(Boolean))] as string[];
    }, [tickets]);

    const { data: profiles } = useQuery({
        queryKey: ["helpdesk-profiles", creatorIds],
        queryFn: async () => {
            if (creatorIds.length === 0) return {};
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .in("id", creatorIds);
            if (error) throw error;
            const map: Record<string, string> = {};
            data?.forEach(p => {
                map[p.id] = p.full_name || p.email || "Unknown";
            });
            return map;
        },
        enabled: creatorIds.length > 0,
    });

    // Merge requester names into tickets
    const enrichedTickets = useMemo(() => {
        if (!tickets) return [];
        return tickets.map(t => ({
            ...t,
            requester_name: (profiles && t.created_by ? profiles[t.created_by] : null) || t.creator?.email || "Unknown",
        }));
    }, [tickets, profiles]);

    const stats = {
        total: enrichedTickets.length,
        open: enrichedTickets.filter((t) => t.status === "open").length,
        inProgress: enrichedTickets.filter((t) => t.status === "in_progress").length,
        resolved: enrichedTickets.filter((t) => ["resolved", "closed"].includes(t.status)).length,
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">IT Helpdesk</h1>
                    <p className="text-muted-foreground mt-1">
                        Submit generic support requests or report technical issues.
                    </p>
                </div>
                <CreateTicketDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.open}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resolved}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="all">All Tickets</TabsTrigger>
                        <TabsTrigger value="open">Open / In Progress</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved / Closed</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="mt-0">
                    <TicketList tickets={enrichedTickets} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="open" className="mt-0">
                    <TicketList tickets={enrichedTickets} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="resolved" className="mt-0">
                    <TicketList tickets={enrichedTickets} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
