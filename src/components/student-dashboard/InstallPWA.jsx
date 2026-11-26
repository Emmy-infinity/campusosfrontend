// src/components/InstallPWA.jsx
import { useState, useEffect } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';

export default function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // 👇 FORCE SHOW IN DEV MODE FOR VISUAL TESTING
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // 3. Check if the event already fired BEFORE React mounted (caught by index.html)
    if (window.deferredPrompt) {
      setShowPrompt(true);
    }

    // 4. Listen for the custom event dispatched by index.html if it fires AFTER mounting
    const handleReady = () => setShowPrompt(true);
    const appInstalledHandler = () => setIsInstalled(true);

    window.addEventListener("bip-ready", handleReady);
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener("bip-ready", handleReady);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const onClickInstall = async (evt) => {
    evt.preventDefault();
    
    // Handle iOS
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Handle standard Chrome/Android
    if (!window.deferredPrompt) {
      if (isDev) alert("In production, this opens the native install prompt! (Make sure you build the app first).");
      return;
    }

    // Trigger the native prompt
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      window.deferredPrompt = null;
      setShowPrompt(false);
    }
  };

  // Allow showing in dev mode even if Chrome hasn't fired the event yet
  if (isInstalled || (!showPrompt && !isIOS && !isDev)) {
    return null;
  }

  return (
    <>
      <Button
        onClick={onClickInstall}
        startIcon={<DownloadRoundedIcon />}
        fullWidth
        sx={{
          py: 1.2,
          mb: 2.5,
          borderRadius: 2.5,
          fontWeight: 700,
          fontSize: 14,
          textTransform: "none",
          color: "#fff",
          background: "rgba(99,102,241,0.12)",
          border: "1px dashed rgba(129,140,248,0.6)",
          transition: "all .2s ease",
          "&:hover": {
            background: "rgba(99,102,241,0.25)",
            border: "1px solid rgba(129,140,248,0.9)",
            transform: "translateY(-1px)",
          },
        }}
      >
        Install CampusOS App
      </Button>

      <Dialog 
        open={showIOSInstructions} 
        onClose={() => setShowIOSInstructions(false)} 
        PaperProps={{ sx: { bgcolor: '#101527', color: 'white', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Install on iPhone/iPad</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
            Tap the <ShareRoundedIcon sx={{ fontSize: 18, verticalAlign: 'middle', color: '#818CF8' }} /> <strong>Share</strong> button at the bottom of Safari.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Then tap <strong>"Add to Home Screen"</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowIOSInstructions(false)} sx={{ color: '#A5B4FC', fontWeight: 700 }}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
