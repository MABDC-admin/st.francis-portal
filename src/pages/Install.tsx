import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Share, MoreVertical, PlusSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Install SFXSAI Portal</h1>
          <p className="text-muted-foreground">
            Install the app on your device for quick access, offline support, and a native app experience.
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-primary font-medium">
                ✅ App is already installed! You can open it from your home screen.
              </p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full text-lg h-14">
            <Download className="h-5 w-5 mr-2" /> Install Now
          </Button>
        ) : null}

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-5 w-5 text-primary" /> iPhone / iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>Tap the <Share className="inline h-4 w-4" /> Share button in Safari</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>Scroll down and tap <PlusSquare className="inline h-4 w-4" /> "Add to Home Screen"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>Tap "Add" to confirm</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-5 w-5 text-primary" /> Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>Tap the <MoreVertical className="inline h-4 w-4" /> menu button in Chrome</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>Tap "Install app" or "Add to Home screen"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>Tap "Install" to confirm</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="h-5 w-5 text-primary" /> Desktop (Chrome / Edge)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>Click the install icon in the address bar</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>Click "Install" to confirm</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Install;
