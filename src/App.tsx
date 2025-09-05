import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const DEFAULT_AVATAR = "/pp.jpg"; // served from public/
  const [avatarSrc, setAvatarSrc] = useState<string>(DEFAULT_AVATAR);
  const [now, setNow] = useState<Date>(new Date());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("avatarSrc");
    if (saved) setAvatarSrc(saved);
  }, []);

  useEffect(() => {
    if (avatarSrc) localStorage.setItem("avatarSrc", avatarSrc);
    else localStorage.removeItem("avatarSrc");
  }, [avatarSrc]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const resized = await resizeDataUrl(dataUrl, 800);
      setAvatarSrc(resized);
    } catch (err) {
      console.error(err);
      const reader = new FileReader();
      reader.onload = () => setAvatarSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // const clearPhoto = () => setAvatarSrc(null);

  const [flashing, setFlashing] = useState(false);

  const handleVerify = () => {
    // Retrigger animation even if already active
    setFlashing(false);
    requestAnimationFrame(() => setFlashing(true));
  };


  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const formattedDate = (date: Date): string => {
    return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}.${date.getFullYear()}`;
  };

  const calculateAge = (birthDate: Date): number => {
    const ageDiff = now.getTime() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const birthDate = new Date(2001, 8, 20); // September 20, 2001

  return (
    <>
    <header className="sikt-header">
        <img src="/sikt-logo.png" alt="Sikt logo" className="logo" />
        <img src="/three-dots.png" alt="Menu" className="menu" />
      </header>
    <div className="sikt-app">
      

      <div className="sikt-card">
        {/* Avatar */}
        <div
          className="sikt-avatar cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={avatarSrc ? "Change profile photo" : "Add profile photo"}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" />
          ) : (
            <span className="fallback flex items-center justify-center text-3xl">👤</span>
          )}
          
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="sikt-info mt-8">
          <p className="text-2xl">Boyan Yu ({calculateAge(birthDate)})</p>

          <div className="sikt-row">
            <img src="/calendar.svg" alt="" className="icon" />
            <span className="sikt-key">Date of birth:</span>
            <span className="sikt-val">{formattedDate(birthDate)}</span>
          </div>

          <div className="sikt-row">
            <img src="/identity.svg" alt="" className="icon" />
            <span className="sikt-key">Student number:</span>
            <span className="sikt-val">546185</span>
          </div>

          <div className="sikt-row">
            <img src="/graduation-cap.svg" alt="" className="icon" />
            <span className="sikt-key">Institution:</span>
            <span className="sikt-val">
              Norges teknisk-naturvitenskapelige universitet - NTNU
            </span>
          </div>
        </div>


        {/* Valid section (just demo, styled) */}
        <div
          className={`sikt-valid text-center ${flashing ? "flash-valid" : ""}`}
          onAnimationEnd={() => setFlashing(false)}
        >
          <div className="title">Valid student ID</div>
          <div className="sub">Autumn 2025</div>
          <span className="expires">Expires: </span>
          <span className="expires-date text-sm">31.01.2026</span>
        </div>

        <button className="btn-primary" onClick={handleVerify}>Verify</button>

        <button className="btn-outline text-center justify-center">
          <span className="mr-3">European Student Card</span>
          <img src="/qr-code.svg" alt="QR Code" className="icon" />
        </button>

        <div className="sikt-meta gap-4">
          <div className="row">
            <span className="font-bold">Last updated: </span><span>{formattedDate(now)} at {formattedTime} (CEST)</span><br />
          </div>
          <div className="row">
            <span className="font-bold">Timezone: </span><span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span> <br />
          </div>
          <div className="row">
            <span className="font-bold">Version: 4.1.9</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// --- Helpers ---
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function resizeDataUrl(dataUrl: string, maxSize = 800): Promise<string> {
  const img = await loadImage(dataUrl);
  const { width, height } = scaleToFit(img.width, img.height, maxSize);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function scaleToFit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
