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
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const openPicker = (index: number) => {
    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSlots((prev) => {
        const next = [...prev];
        next[activeSlot] = reader.result as string;
        return next;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
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
        className="hidden-input"
        onChange={onFileChange}
      />

      <div className="toolbar">
        <h1 className="toolbar-title">منشئ صفحة الصور</h1>
        <p className="toolbar-sub">
          اضغط على أي مستطيل أزرق لرفع صورة، ثم صدّر الصفحة كـ PDF أو PNG
        </p>
        <div className="toolbar-actions">
          <button className="btn btn-pdf" onClick={exportPDF} disabled={busy}>
            {busy ? "جاري التصدير..." : "تصدير PDF"}
          </button>
          <button className="btn btn-png" onClick={exportPNG} disabled={busy}>
            {busy ? "جاري التصدير..." : "تصدير PNG"}
          </button>
        </div>
      </div>

      <div className="page-scaler">
        {/* The exported page */}
        <div className="page" ref={pageRef}>
          <div className="bg-streaks" />

          {/* Header rule */}
          <div className="header-rule">
            <span className="rule-line" />
          </div>

          {/* Title */}
          <div className="title-box">
            <span className="title-text">صــور من داخـــل الموقـــع</span>
          </div>

          {/* Three slots */}
          <div className="slots">
            {slots.map((src, i) => (
              <div
                key={i}
                className="slot"
                style={{ backgroundColor: NAVY }}
                onClick={() => !src && openPicker(i)}
              >
                {src ? (
                  <>
                    <div className="slot-img" style={{ backgroundImage: `url(${src})` }} />
                    <div className="slot-overlay" data-html2canvas-ignore="true">
                      <button
                        className="ov-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPicker(i);
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
                    <span>اضغط لرفع صورة</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="bottom-bar" />
        </div>
      </div>
    </div>
  );
}
