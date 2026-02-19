import { File, Download, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Attachment = Database["public"]["Tables"]["helpdesk_attachments"]["Row"];

interface AttachmentListProps {
    attachments: Attachment[];
    canDelete?: boolean;
    onDelete?: () => void;
}

export function AttachmentList({ attachments, canDelete = false, onDelete }: AttachmentListProps) {
    if (!attachments || attachments.length === 0) return null;

    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('helpdesk-files')
                .download(filePath);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            toast.error("Error downloading file: " + error.message);
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {attachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate" title={file.file_name}>
                            {file.file_name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                            ({(file.file_size / 1024).toFixed(1)} KB)
                        </span>
                    </div>
                    <div className="flex shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file.file_path, file.file_name)}>
                            <Download className="h-4 w-4" />
                        </Button>
                        {/* 
            // Preview logic could go here if image
             */}
                    </div>
                </div>
            ))}
        </div>
    );
}
