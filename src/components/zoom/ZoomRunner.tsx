import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useZoomSession } from '@/hooks/useZoomSession';
import { Loader2, Video, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchoolId } from '@/hooks/useSchoolId';

declare global {
    interface Window {
        ZoomMtg: any;
    }
}

export const ZoomRunner = () => {
    const { data: schoolId } = useSchoolId();
    const { settings, inSession, loading: sessionLoading } = useZoomSession(schoolId);
    const [isJoined, setIsJoined] = useState(false);
    const [sdkLoading, setSdkLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const initializationStarted = useRef(false);

    // Dynamically load Zoom SDK scripts
    useEffect(() => {
        const loadScripts = async () => {
            if (typeof window.ZoomMtg !== 'undefined') {
                setSdkLoading(false);
                return;
            }

            const scripts = [
                'https://source.zoom.us/zoom-meeting-3.1.0.min.js'
            ];

            // Add dependencies first (usually required by Zoom SDK)
            const deps = [
                'https://source.zoom.us/3.1.0/lib/vendor/react.min.js',
                'https://source.zoom.us/3.1.0/lib/vendor/react-dom.min.js',
                'https://source.zoom.us/3.1.0/lib/vendor/redux.min.js',
                'https://source.zoom.us/3.1.0/lib/vendor/redux-thunk.min.js',
                'https://source.zoom.us/3.1.0/lib/vendor/lodash.min.js'
            ];

            try {
                for (const url of [...deps, ...scripts]) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = url;
                        script.onload = resolve;
                        script.onerror = reject;
                        document.body.appendChild(script);
                    });
                }

                const ZoomMtg = window.ZoomMtg as any;
                if (ZoomMtg) {
                    ZoomMtg.setZoomJSLib('https://source.zoom.us/3.1.0/lib', '/av');
                    ZoomMtg.preLoadWasm();
                    ZoomMtg.prepareWebSDK();
                }

                setSdkLoading(false);
            } catch (err) {
                console.error('Failed to load Zoom SDK:', err);
                setError('Failed to load meeting infrastructure.');
            }
        };

        loadScripts();
    }, []);

    useEffect(() => {
        if (!inSession || isJoined || sdkLoading || !settings || !schoolId || initializationStarted.current) return;

        initializationStarted.current = true;
        startMeeting();
    }, [inSession, isJoined, sdkLoading, settings, schoolId]);

    const startMeeting = async () => {
        if (!settings?.meeting_id) return;

        try {
            toast.info('Initiating automated Zoom session...');

            // Get secure credentials from Edge Function
            const { data, error: authError } = await supabase.functions.invoke('zoom-auth', {
                body: { meetingNumber: settings.meeting_id, role: 1 }, // role 1 = host
            });

            if (authError || !data) throw new Error(authError?.message || 'Failed to authorize meeting');

            window.ZoomMtg.init({
                leaveUrl: window.location.origin,
                success: (success: any) => {
                    window.ZoomMtg.join({
                        signature: data.signature,
                        sdkKey: data.sdkKey,
                        meetingNumber: settings.meeting_id!,
                        userName: 'Automated Host',
                        passWord: settings.meeting_password || '',
                        zakToken: data.zakToken,
                        success: (success: any) => {
                            console.log('Successfully joined meeting');
                            setIsJoined(true);
                            toast.success('Successfully joined as Host');
                        },
                        error: (error: any) => {
                            console.error('Join Error:', error);
                            setError(error.result || 'Failed to join meeting');
                            initializationStarted.current = false;
                        }
                    });
                },
                error: (error: any) => {
                    console.error('Init Error:', error);
                    setError(error.result || 'Failed to initialize meeting SDK');
                    initializationStarted.current = false;
                }
            });

        } catch (err: any) {
            console.error('Meeting Start Error:', err);
            setError(err.message || 'An unexpected error occurred.');
            initializationStarted.current = false;
        }
    };

    if (sessionLoading || sdkLoading) {
        return (
            <Card className="max-w-md mx-auto mt-20">
                <CardContent className="flex flex-col items-center py-10 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Initializing Production Zoom Bridge...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="max-w-md mx-auto mt-20 border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Automation Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Retry Connection
                    </button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto mt-20 shadow-lg overflow-hidden border-none bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="bg-primary/5 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Automated Zoom Runner
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                        <span className="text-sm font-medium">Session Status</span>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${inSession ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                            <span className="text-xs uppercase font-bold tracking-wider">
                                {inSession ? 'Active' : 'Standby'}
                            </span>
                        </div>
                    </div>

                    <div className="text-center p-8">
                        {isJoined ? (
                            <div className="space-y-2">
                                <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-2">
                                    <Video className="h-8 w-8 text-green-500" />
                                </div>
                                <h4 className="font-bold text-foreground">Host Connected</h4>
                                <p className="text-xs text-muted-foreground">The classroom automation is running normally.</p>
                            </div>
                        ) : inSession ? (
                            <div className="space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="text-sm text-muted-foreground italic">Authenticating and joining meeting...</p>
                            </div>
                        ) : (
                            <div className="space-y-2 py-4">
                                <p className="text-sm text-muted-foreground">Waiting for scheduled school hours...</p>
                                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">UAE Time: {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dubai' })}</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
