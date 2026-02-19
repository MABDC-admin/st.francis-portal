import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, X, FileText, Upload, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface Attachment {
    name: string;
    url: string;
    type: string;
    size: number;
}

interface MultiFileUploaderProps {
    attachments: Attachment[];
    onChange: (attachments: Attachment[]) => void;
    maxSizeMB?: number;
}

const MAX_SIZE_MB = 100;

export const MultiFileUploader = ({ attachments, onChange, maxSizeMB = MAX_SIZE_MB }: MultiFileUploaderProps) => {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        const newAttachments = [...attachments];
        let hasError = false;

        for (const file of acceptedFiles) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast.error(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
                hasError = true;
                continue;
            }

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${crypto.randomUUID()}.${fileExt}`;
                const filePath = `tasks/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('task-attachments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('task-attachments')
                    .getPublicUrl(filePath);

                newAttachments.push({
                    name: file.name,
                    url: publicUrl,
                    type: file.type,
                    size: file.size,
                });
            } catch (error: any) {
                toast.error(`Error uploading ${file.name}: ${error.message}`);
                hasError = true;
            }
        }

        if (!hasError) toast.success('Upload successful');
        onChange(newAttachments);
        setUploading(false);
    }, [attachments, onChange, maxSizeMB]);

    const removeAttachment = (index: number) => {
        const updated = attachments.filter((_, i) => i !== index);
        onChange(updated);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: uploading,
    });

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (type.startsWith('video/')) return <VideoIcon className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">
                        {isDragActive ? 'Drop files here' : 'Click or drag files to upload'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Images, Videos, Documents (Max {maxSizeMB}MB)
                    </p>
                </div>
            </div>

            {attachments.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                    {attachments.map((file, index) => (
                        <div
                            key={file.url}
                            className="flex items-center gap-3 p-2 border rounded-md bg-card hover:bg-accent/50 transition-colors group"
                        >
                            <div className="p-2 bg-muted rounded">
                                {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                onClick={() => removeAttachment(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
