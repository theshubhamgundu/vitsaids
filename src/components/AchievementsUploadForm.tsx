// src/components/AchievementsUploadForm.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToGitHubRepo } from '@/lib/github-utils'; // Ensure this utility is correctly implemented

interface Achievement {
    id: string;
    title: string;
    description?: string;
    date?: string;
    certificate_url?: string;
}

interface AchievementsUploadFormProps {
    onUploadSuccess: () => void;
    achievements: Achievement[];
    setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
    isUploading: boolean;
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
    isUpdating: boolean;
    setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>;
    // This persistGitHubData is passed from AdminDashboard, and currently simulates failure.
    persistGitHubData: (dataArray: Achievement[], filePath: string, variableName: string, commitMessage: string) => Promise<boolean>;
    isEdit?: boolean;
    initialData?: Achievement | null;
}

const AchievementsUploadForm: React.FC<AchievementsUploadFormProps> = ({
    onUploadSuccess,
    achievements,
    setAchievements,
    isUploading,
    setIsUploading,
    isUpdating,
    setIsUpdating,
    persistGitHubData,
    isEdit = false,
    initialData = null
}) => {
    const { toast } = useToast();
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date || '');
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (isEdit && initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setDate(initialData.date || '');
            // Do not set certificateFile from initialData.certificate_url here
            // as it's a URL, not a File object. User will re-upload if needed.
        }
    }, [isEdit, initialData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCertificateFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title) {
            toast({ title: 'Title is required', variant: 'destructive' });
            return;
        }

        setIsUploading(true);
        try {
            let fileUrl = initialData?.certificate_url; // Keep existing URL if not uploading new file
            if (certificateFile) {
                const fileExtension = certificateFile.name.split('.').pop();
                const fileName = `achievement-${Date.now()}.${fileExtension}`;
                const pathInRepo = `public/achievements/${fileName}`;

                const uploadSuccess = await uploadToGitHubRepo(certificateFile, pathInRepo, `Upload achievement certificate for ${title}`);
                if (!uploadSuccess) {
                    throw new Error("Failed to upload certificate to GitHub. Check github-utils.ts and network.");
                }
                // IMPORTANT: Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME` with your actual values.
                // This assumes your GitHub Pages or Vercel deployment serves `public/` directly.
                fileUrl = `https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/${pathInRepo}`; // *** IMPORTANT: REPLACE WITH YOUR ACTUAL GITHUB USERNAME AND REPO NAME ***
            }

            const newAchievement: Achievement = {
                id: isEdit && initialData ? initialData.id : crypto.randomUUID(),
                title,
                description: description || undefined,
                date: date || undefined,
                certificate_url: fileUrl || undefined,
            };

            let updatedAchievements;
            if (isEdit && initialData) {
                updatedAchievements = achievements.map(item =>
                    item.id === initialData.id ? newAchievement : item
                );
            } else {
                updatedAchievements = [...achievements, newAchievement];
            }

            setAchievements(updatedAchievements); // Optimistic update
            // IMPORTANT: The path for metadata should typically be `src/data/achievements.json`
            // Ensure your API route (if you have one for this) handles writing to `src/data`.
            const success = await persistGitHubData(updatedAchievements, 'src/data/achievements.json', 'achievements', `Add/Update Achievement: ${title}`);
            if (!success) {
                setAchievements(achievements); // Revert optimistic update if persistence fails
                toast({ title: 'Error', description: 'Failed to save achievement metadata to GitHub. Persistence is simulated as incomplete.', variant: 'destructive' });
                return;
            }

            toast({ title: `Achievement ${isEdit ? 'updated' : 'uploaded'} successfully` });
            setDialogOpen(false); // Close dialog on success
            setTitle('');
            setDescription('');
            setDate('');
            setCertificateFile(null);
            onUploadSuccess(); // Refresh parent data (e.g., loadAchievements, loadStats)
        } catch (error: any) {
            console.error("Error uploading achievement:", error);
            toast({ title: "Upload failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto h-8 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>{isEdit ? 'Edit' : 'Add New Achievement'}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Achievement' : 'Upload New Achievement'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="achievement-title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="achievement-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Best Project Award"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="achievement-description" className="text-right">
                            Description
                        </Label>
                        <Textarea
                            id="achievement-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                            placeholder="Brief description of the achievement"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="achievement-date" className="text-right">
                            Date (Optional)
                        </Label>
                        <Input
                            id="achievement-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="achievement-file" className="text-right">
                            Certificate (PDF/Image)
                        </Label>
                        <Input
                            id="achievement-file"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileChange}
                            className="col-span-3"
                        />
                    </div>
                    {initialData?.certificate_url && !certificateFile && (
                        <div className="col-span-4 text-center text-sm text-gray-500">
                            Existing file: <a href={initialData.certificate_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Current</a>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isUploading || isUpdating}>
                        {isUploading || isUpdating ? (isEdit ? 'Updating...' : 'Uploading...') : (isEdit ? 'Save Changes' : 'Upload Achievement')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AchievementsUploadForm;
