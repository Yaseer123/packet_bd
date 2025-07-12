import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface YoutubeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

export default function YoutubeDialog({
  isOpen,
  onClose,
  onSubmit,
}: YoutubeDialogProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!url.trim()) {
      setError("URL cannot be empty");
      return;
    }

    // More robust YouTube URL validation
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)(.+)?/i;
    if (!youtubeRegex.test(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    // Extract video ID to ensure it's a valid YouTube URL
    const videoIdRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.?be\/)([^"&?\/\s]{11})/i;
    const match = videoIdRegex.exec(url);

    if (!match) {
      setError("Could not extract YouTube video ID. Please check the URL.");
      return;
    }

    onSubmit(url);
    setUrl("");
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="youtube-url">YouTube Video URL</Label>
            <Input
              id="youtube-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-sm text-gray-500">
              Supported formats: youtube.com/watch, youtu.be/ID,
              youtube.com/embed
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Embed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
