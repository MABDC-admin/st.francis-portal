import { motion } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportData, REPORT_CATEGORIES } from './reportTypes';

interface ReportPreviewProps {
  categoryId: string | null;
  subTypeId: string | null;
  data: ReportData | null;
  isLoading: boolean;
  onGenerate: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
}

export const ReportPreview = ({
  categoryId,
  subTypeId,
  data,
  isLoading,
  onGenerate,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  onPrint,
}: ReportPreviewProps) => {
  const category = REPORT_CATEGORIES.find(c => c.id === categoryId);
  const subType = category?.subTypes.find(st => st.id === subTypeId);

  if (!subTypeId) {
    return (
      <Card className="flex-1">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">Select a Report</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Choose a report category and type from the left panel, then click Generate to preview the data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 overflow-hidden">
      <CardContent className="p-4">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-lg text-foreground">{subType?.label}</h2>
            <p className="text-xs text-muted-foreground">{subType?.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={onGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1" />}
              Generate
            </Button>
            {data && (
              <>
                <Button size="sm" variant="outline" onClick={onExportPDF}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={onExportExcel}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                  Excel
                </Button>
                <Button size="sm" variant="outline" onClick={onExportCSV}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={onPrint}>
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Print
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {/* Data Table */}
        {!isLoading && data && data.rows.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {data.summary && (
              <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(data.summary).map(([key, val]) => (
                  <Badge key={key} variant="secondary" className="text-xs px-3 py-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}: <span className="font-bold ml-1">{String(val)}</span>
                  </Badge>
                ))}
              </div>
            )}

            <div className="border rounded-lg overflow-auto max-h-[60vh] print:max-h-none print:overflow-visible" id="report-print-area">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-xs">#</TableHead>
                    {data.columns.map(col => (
                      <TableHead key={col.key} className="text-xs whitespace-nowrap">{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {data.columns.map(col => (
                        <TableCell key={col.key} className="text-xs">
                          {col.key === 'status' ? (
                            <Badge variant={row[col.key] === 'Passing' || row[col.key] === 'active' || row[col.key] === 'present' ? 'default' : 'destructive'} className="text-[10px]">
                              {String(row[col.key] ?? '')}
                            </Badge>
                          ) : (
                            String(row[col.key] ?? '')
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Showing {data.rows.length} of {data.totalCount} records
            </p>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && data && data.rows.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No Data Found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or selecting a different date range.</p>
          </div>
        )}

        {/* Not Yet Generated */}
        {!isLoading && !data && (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Ready to Generate</h3>
            <p className="text-sm text-muted-foreground mb-4">Apply filters and click Generate to preview the report.</p>
            <Button onClick={onGenerate}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
