import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon, Video, CheckCircle2, XCircle, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';

interface BannerRecord {
    id: string;
    school_id: string;
    title: string;
    type: 'image' | 'video';
    url: string;
    thumbnail_url?: string | null;
    is_active: boolean;
    created_at: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

export const BannerManagement = () => {
    const queryClient = useQueryClient();
    const { data: schoolId } = useSchoolId();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<BannerRecord | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

    const mediaInputRef = useRef<HTMLInputElement>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        type: 'image' as 'image' | 'video',
        url: '',
        thumbnail_url: '',
        is_active: true,
    });

    // Fetch banners
    const { data: banners = [], isLoading } = useQuery({
        queryKey: ['banner-management', schoolId],
        queryFn: async () => {
            if (!schoolId) return [];
            const { data, error } = await supabase
                .from('promotional_banners' as any)
                .select('*')
                .eq('school_id', schoolId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as unknown) as BannerRecord[] || [];
        },
        enabled: !!schoolId,
    });

    // Upload helper
    const handleFileUpload = async (
        file: File,
        field: 'url' | 'thumbnail_url',
        setLoadingState: (v: boolean) => void,
    ) => {
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.size > maxSize) {
            toast.error(`File too large. Max ${isVideo ? '20MB' : '5MB'}.`);
            return;
        }
        setLoadingState(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `banners/${crypto.randomUUID()}/${file.name}`;
            const { error } = await supabase.storage.from('school-gallery').upload(path, file, { contentType: file.type });
            if (error) throw error;
            const { data: urlData } = supabase.storage.from('school-gallery').getPublicUrl(path);
            setFormData(prev => ({ ...prev, [field]: urlData.publicUrl }));
            toast.success('File uploaded');
        } catch (err: any) {
            toast.error(err.message || 'Upload failed');
        } finally {
            setLoadingState(false);
        }
    };

    // Create/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (!schoolId) throw new Error('Missing school ID');
            const payload = { ...data, school_id: schoolId, updated_at: new Date().toISOString() };
            if (editingRecord) {
                const { error } = await supabase.from('promotional_banners' as any).update(payload).eq('id', editingRecord.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('promotional_banners' as any).insert([payload]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banner-management'] });
            toast.success(editingRecord ? 'Banner updated' : 'Banner created');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to save banner');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('promotional_banners' as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banner-management'] });
            toast.success('Banner deleted');
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete banner');
        },
    });

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
        setFormData({ title: '', type: 'image', url: '', thumbnail_url: '', is_active: true });
    };

    const handleEdit = (record: BannerRecord) => {
        setEditingRecord(record);
        setFormData({
            title: record.title,
            type: record.type,
            url: record.url,
            thumbnail_url: record.thumbnail_url || '',
            is_active: record.is_active,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.url) {
            toast.error('Please fill in title and upload media');
            return;
        }
        saveMutation.mutate(formData);
    };

    const mediaAccept = formData.type === 'video' ? 'video/mp4,video/webm' : 'image/png,image/jpeg,image/webp,image/gif';

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Banner Management</h1>
                    <p className="text-muted-foreground mt-1">Manage promotional images and videos for the student dashboard</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Banner
                </Button>
            </motion.div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Active Banners
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No banners found. Add your first promotional banner!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {banners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell>
                                                <div className="w-16 h-9 rounded bg-muted overflow-hidden flex items-center justify-center">
                                                    {banner.type === 'video' ? (
                                                        <Video className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <img src={banner.url} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{banner.title}</TableCell>
                                            <TableCell className="capitalize">{banner.type}</TableCell>
                                            <TableCell>
                                                {banner.is_active ? (
                                                    <div className="flex items-center gap-1.5 text-success">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-xs font-medium">Active</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <XCircle className="h-4 w-4" />
                                                        <span className="text-xs font-medium">Inactive</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)} className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingRecord ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Back to School Event"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Media Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: 'image' | 'video') => setFormData({ ...formData, type: value, url: '', thumbnail_url: '' })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    id="active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </div>

                        {/* Media Upload */}
                        <div className="space-y-2">
                            <Label>Upload Media *</Label>
                            <input
                                ref={mediaInputRef}
                                type="file"
                                accept={mediaAccept}
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, 'url', setUploading);
                                    e.target.value = '';
                                }}
                            />
                            {formData.url ? (
                                <div className="relative rounded-md border border-border overflow-hidden">
                                    {formData.type === 'video' ? (
                                        <div className="flex items-center gap-3 p-3 bg-muted/50">
                                            <Video className="h-8 w-8 text-muted-foreground shrink-0" />
                                            <span className="text-sm text-foreground truncate">Video uploaded</span>
                                        </div>
                                    ) : (
                                        <img src={formData.url} alt="Preview" className="w-full h-32 object-cover" />
                                    )}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => setFormData(prev => ({ ...prev, url: '' }))}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => mediaInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border p-6 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <span className="text-sm">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8" />
                                            <span className="text-sm">Click to upload {formData.type}</span>
                                            <span className="text-xs">Max {formData.type === 'video' ? '20MB' : '5MB'}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Thumbnail Upload (video only) */}
                        {formData.type === 'video' && (
                            <div className="space-y-2">
                                <Label>Thumbnail (optional)</Label>
                                <input
                                    ref={thumbInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file, 'thumbnail_url', setUploadingThumbnail);
                                        e.target.value = '';
                                    }}
                                />
                                {formData.thumbnail_url ? (
                                    <div className="relative rounded-md border border-border overflow-hidden">
                                        <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-24 object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => thumbInputRef.current?.click()}
                                        disabled={uploadingThumbnail}
                                        className="w-full flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border p-4 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
                                    >
                                        {uploadingThumbnail ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span className="text-sm">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-6 w-6" />
                                                <span className="text-sm">Upload thumbnail image</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                            <Button type="submit" disabled={saveMutation.isPending || uploading || uploadingThumbnail}>
                                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editingRecord ? 'Update Banner' : 'Create Banner'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
                        <AlertDialogDescription>This banner will be permanently removed. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingId && deleteMutation.mutate(deletingId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
