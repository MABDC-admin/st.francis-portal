import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Table2, RefreshCw, ExternalLink, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NocoBase {
  id: string;
  title: string;
  description?: string;
}

interface NocoTable {
  id: string;
  title: string;
  meta?: any;
}

interface NocoRecord {
  Id: number;
  [key: string]: any;
}

export const NocoDBDashboard = () => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [bases, setBases] = useState<NocoBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [tables, setTables] = useState<NocoTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [records, setRecords] = useState<NocoRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const callProxy = async (action: string, path?: string, body?: any) => {
    const { data: result, error } = await supabase.functions.invoke('nocodb-proxy', {
      body: { action, path, body },
    });
    if (error) throw error;
    return result;
  };

  const loadBases = async () => {
    setLoading(true);
    try {
      const result = await callProxy('GET', '/api/v2/meta/bases');
      if (result.configured === false) {
        setConfigured(false);
        return;
      }
      setConfigured(true);
      setBases(result.data?.list || []);
    } catch (err: any) {
      toast.error('Failed to load NocoDB bases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async (baseId: string) => {
    setLoading(true);
    try {
      const result = await callProxy('GET', `/api/v2/meta/bases/${baseId}/tables`);
      setTables(result.data?.list || []);
      setSelectedBase(baseId);
      setSelectedTable(null);
      setRecords([]);
    } catch (err: any) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (tableId: string) => {
    setLoading(true);
    try {
      const result = await callProxy('GET', `/api/v2/tables/${tableId}/records`);
      const list = result.data?.list || [];
      setRecords(list);
      setSelectedTable(tableId);
      if (list.length > 0) {
        setColumns(Object.keys(list[0]).filter(k => k !== 'ncRecordId' && k !== 'ncRecordOrder'));
      }
    } catch (err: any) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBases(); }, []);

  const filteredRecords = records.filter(r =>
    !searchQuery || Object.values(r).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (configured === false) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">NocoDB</h1>
          <p className="text-muted-foreground mt-1">Database & Spreadsheet Platform</p>
        </motion.div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">NocoDB Not Configured</h3>
            <p className="text-muted-foreground max-w-md">
              Please provide your NocoDB server URL and API token to connect. Contact your administrator to set up the <code className="bg-muted px-1 rounded">NOCODB_BASE_URL</code> and <code className="bg-muted px-1 rounded">NOCODB_API_TOKEN</code> secrets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">NocoDB</h1>
          <p className="text-muted-foreground mt-1">Database & Spreadsheet Platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadBases}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </motion.div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => { setSelectedBase(null); setSelectedTable(null); setRecords([]); }} className="text-primary hover:underline">
          Bases
        </button>
        {selectedBase && (
          <>
            <span className="text-muted-foreground">/</span>
            <button onClick={() => { setSelectedTable(null); setRecords([]); }} className="text-primary hover:underline">
              Tables
            </button>
          </>
        )}
        {selectedTable && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">Records</span>
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !selectedBase ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bases.map(base => (
            <Card key={base.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadTables(base.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-primary" />
                  {base.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{base.description || 'Click to view tables'}</p>
              </CardContent>
            </Card>
          ))}
          {bases.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">No bases found.</p>
          )}
        </div>
      ) : !selectedTable ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <Card key={table.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadRecords(table.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Table2 className="h-5 w-5 text-primary" />
                  {table.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Click to view records</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search records..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="secondary">{filteredRecords.length} records</Badge>
          </div>

          <div className="border rounded-lg overflow-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-teal-600 text-white sticky top-0">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-4 py-2 text-left font-semibold text-white whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-gray-800/30">
                {filteredRecords.map((record, idx) => (
                  <tr key={idx} className="border-t hover:bg-muted/30">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate">
                        {typeof record[col] === 'object' ? JSON.stringify(record[col]) : String(record[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
