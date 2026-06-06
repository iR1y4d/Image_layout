import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./page.css";

const NAVY = "#0d3a54";

type Slots = (string | null)[];

export default function App() {
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slots>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Check if there is at least one image in the slots
  const hasImages = slots.some((slot) => slot !== null);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    const filePromises = fileArray.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then((newImages) => {
      setSlots((prev) => {
        const next = [...prev];
        let imageIdx = 0;

        for (let i = 0; i < next.length; i++) {
          if (next[i] === null && imageIdx < newImages.length) {
            next[i] = newImages[imageIdx];
            imageIdx++;
          }
        }
        return next;
      });
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  // Completely resets all slots to null
  const clearAllImages = () => {

      setSlots([null, null, null]);

  };

  const changeSingleImage = (index: number) => {
    const tempInput = document.createElement("input");
    tempInput.type = "file";
    tempInput.accept = "image/*";
    tempInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setSlots((prev) => {
          const next = [...prev];
          next[index] = reader.result as string;
          return next;
        });
      };
      reader.readAsDataURL(file);
    };
    tempInput.click();
  };

  const capture = useCallback(async () => {
    const el = pageRef.current;
    if (!el) return null;
    return await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  }, []);

  const exportPNG = async () => {
    setBusy(true);
    try {
      const canvas = await capture();
      if (!canvas) return;
      const imgData = canvas.toDataURL("image/png");
      setPreviewUrl(imgData);
      const link = document.createElement("a");
      link.download = "صور-من-داخل-الموقع.png";
      link.href = imgData;
      link.click();
    } finally {
      setBusy(false);
    }
  };

  const exportPDF = async () => {
    setBusy(true);
    try {
      const canvas = await capture();
      if (!canvas) return;
      const imgData = canvas.toDataURL("image/png");
      setPreviewUrl(imgData);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
      pdf.save("صور-من-داخل-الموقع.pdf");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-input"
        onChange={onFileChange}
      />

      <div className="toolbar">
        <h1 className="toolbar-title">منشئ صفحة الصور</h1>
        <p className="toolbar-sub">
          اضغط على أي مستطيل أزرق فارغ لرفع حتى 3 صور دفعة واحدة، ثم صدّر الصفحة كـ PDF أو PNG
        </p>
        <div className="toolbar-actions">
          {/* New Clear Button */}
          <button 
            className="btn btn-clear" 
            onClick={clearAllImages} 
            disabled={!hasImages || busy}
            style={{ 
              backgroundColor: hasImages ? "#d9534f" : "#ccc", 
              color: "#fff",
              cursor: hasImages ? "pointer" : "not-allowed" 
            }}
          >
            مسح الكل
          </button>
          
          <button className="btn btn-pdf" onClick={exportPDF} disabled={busy}>
            {busy ? "جاري التصدير..." : "تصدير PDF"}
          </button>
          <button className="btn btn-png" onClick={exportPNG} disabled={busy}>
            {busy ? "جاري التصدير..." : "تصدير PNG"}
          </button>
        </div>
      </div>

      <div className="page-scaler">
        <div className="page" ref={pageRef}>
          <div className="bg-streaks" />
          <div className="header-rule">
            <span className="rule-line" />
          </div>

          <div className="title-box">
            <span className="title-text">صــور من داخـــل الموقـــع</span>
          </div>

          <div className="slots">
            {slots.map((src, i) => (
              <div
                key={i}
                className="slot"
                style={{ backgroundColor: NAVY }}
                onClick={() => !src && openPicker()}
              >
                {src ? (
                  <>
                    <div className="slot-img" style={{ backgroundImage: `url(${src})` }} />
                    <div className="slot-overlay" data-html2canvas-ignore="true">
                      <button
                        className="ov-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          changeSingleImage(i);
                        }}
                      >
                        تغيير
                      </button>
                      <button
                        className="ov-btn ov-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="slot-hint" data-html2canvas-ignore="true">
                    <span className="plus">＋</span>
                    <span>اضغط لرفع الصور</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bottom-bar" />
        </div>
      </div>
      {previewUrl && (
        <div className="preview-container" style={{ marginTop: 20, textAlign: 'center', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: 10, color: '#0d3a54' }}>معاينة الصورة المصدرة (Export Preview):</h3>
          <img src={previewUrl} style={{ width: '100%', maxWidth: 400, border: '1px solid #ccc' }} alt="Export preview" />
        </div>
      )}
    </div>
  );
}