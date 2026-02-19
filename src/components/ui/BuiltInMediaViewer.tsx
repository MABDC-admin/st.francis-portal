import React from 'react';
import { X, ChevronLeft, Download, ExternalLink, FileText, ImageIcon, VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BuiltInMediaViewerProps {
    url: string;
    name: string;
    type: string;
    onClose: () => void;
}

export const BuiltInMediaViewer = ({ url, name, type, onClose }: BuiltInMediaViewerProps) => {
    const isImage = type?.startsWith('image/');
    const isVideo = type?.startsWith('video/');
    const isPdf = type === 'application/pdf' || name?.toLowerCase().endsWith('.pdf');

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/10 rounded-full"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex-1 px-4 min-w-0">
                    <p className="text-sm font-bold truncate">{name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-white hover:bg-white/10 rounded-full"
                    >
                        <a href={url} download={name}>
                            <Download className="h-5 w-5" />
                        </a>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-white hover:bg-white/10 rounded-full"
                    >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/40">
                {isImage ? (
                    <img
                        src={url}
                        alt={name}
                        className="max-w-full max-h-full object-contain select-none"
                    />
                ) : isVideo ? (
                    <video
                        src={url}
                        controls
                        autoPlay
                        className="max-w-full max-h-full"
                        playsInline
                    />
                ) : isPdf ? (
                    <iframe
                        src={`${url}#view=FitH`}
                        className="w-full h-full border-none bg-white"
                        title={name}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center">
                            <FileText className="h-10 w-10 text-white/50" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">No Preview Available</p>
                            <p className="text-sm text-white/40">This file type cannot be previewed directly.</p>
                        </div>
                        <Button asChild className="bg-white text-slate-950 hover:bg-white/90 rounded-2xl font-black mt-4">
                            <a href={url} download={name}>Download File</a>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
