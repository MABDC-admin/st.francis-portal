import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AttachmentUploadProps {
    ticketId?: string;
    commentId?: string;
    onUploadComplete?: () => void;
}

export function AttachmentUpload({ ticketId, commentId, onUploadComplete }: AttachmentUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!ticketId && !commentId) {
            toast.error("Cannot upload: Missing ticket or comment ID");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        let successCount = 0;
        const totalFiles = acceptedFiles.length;

        for (const file of acceptedFiles) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `${ticketId || 'comments'}/${fileName}`;

                // 1. Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('helpdesk-files')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. Create Attachment Record
                const { error: dbError } = await supabase
                    .from('helpdesk_attachments')
                    .insert({
                        ticket_id: ticketId || null,
                        comment_id: commentId || null,
                        file_name: file.name,
                        file_path: filePath,
                        file_size: file.size,
                        content_type: file.type,
                    });

                if (dbError) throw dbError;

                successCount++;
                setUploadProgress((successCount / totalFiles) * 100);

            } catch (error: any) {
                console.error('Upload failed:', error);
                toast.error(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        setIsUploading(false);
        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} files`);
            onUploadComplete?.();
        }
    }, [ticketId, commentId, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary"
                    }`}
            >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                {isDragActive ? (
                    <p className="text-sm text-muted-foreground">Drop the files here ...</p>
                ) : (
                    <p className="text-sm text-muted-foreground text-center">
                        Drag & drop files here, or click to select files
                    </p>
                )}
            </div>

            {isUploading && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                </div>
            )}
        </div>
    );
}
