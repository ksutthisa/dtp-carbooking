import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Link as LinkIcon, 
  User, 
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Driver } from '../types';

export interface DriverPresetCategory {
  category: string;
  items: {
    name: string;
    description: string;
    url: string;
  }[];
}

export const EXPANDED_DRIVER_PRESETS: DriverPresetCategory[] = [
  {
    category: '👨‍✈️ สารถีชุดเครื่องแบบ / Uniform & Professional',
    items: [
      {
        name: 'สารถีสมศักดิ์ (ชุดสูท)',
        description: 'สารถีอาวุโส ชุดสูททางการ',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีวิชัย (สูทดำเนคไท)',
        description: 'พนักงานขับรถ VIP ผู้บริหาร',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีธนกร (เสื้อเชิ้ตขาว)',
        description: 'สารถีประจำรถตู้หน่วยงาน',
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีประเสริฐ (สูทสุภาพ)',
        description: 'ชำนาญเส้นทางต่างจังหวัด',
        url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
      },
    ],
  },
  {
    category: '👨‍💼 สารถีชายมืออาชีพ / Male Drivers',
    items: [
      {
        name: 'สารถีเอกชัย',
        description: 'ประสบการณ์ขับรถ > 10 ปี',
        url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีอนันต์',
        description: 'สารถีประจำรถเก๋งผู้บริหาร',
        url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีชูเกียรติ',
        description: 'ใจเย็น สุภาพ ปลอดภัย',
        url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีมนตรี',
        description: 'พร้อมบริการ 24 ชั่วโมง',
        url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
      },
    ],
  },
  {
    category: '👩‍💼 สารถีหญิงมืออาชีพ / Female Drivers',
    items: [
      {
        name: 'สารถีวิไลพร',
        description: 'สารถีหญิงยอดเยี่ยม บริการประทับใจ',
        url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีสุพัตรา',
        description: 'ขับขี่นุ่มนวล ตรงต่อเวลา',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีพิมพ์ใจ',
        description: 'ชำนาญเส้นทางในกรุงเทพฯ และปริมณฑล',
        url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'สารถีกัญญารัตน์',
        description: 'สารถีรถผู้บริหารสตรี',
        url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400',
      },
    ],
  },
  {
    category: '🪪 อวตารสัญลักษณ์ / Standard Avatars',
    items: [
      {
        name: 'อวตารทางการ น้ำเงิน',
        description: 'ไอคอนรูปคนสากล',
        url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'อวตารทางการ สุภาพ',
        description: 'ไอคอนโปรไฟล์มาตรฐาน',
        url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=400',
      },
    ],
  },
];

interface DriverPhotoChangeModalProps {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (driverId: string, newPhotoUrl: string) => void;
}

export const DriverPhotoChangeModal: React.FC<DriverPhotoChangeModalProps> = ({
  driver,
  isOpen,
  onClose,
  onSavePhoto,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(driver.photo);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [customUrlInput, setCustomUrlInput] = useState<string>(driver.photo);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image file upload & convert to base64
  const handleFileChange = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (.jpg, .png, .webp, .jpeg)');
      return;
    }

    // Limit size to ~8MB
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์รูปภาพเกิน 8 MB กรุณาเลือกรูปภาพที่มีขนาดเล็กลง');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedUrl(dataUrl);
        setCustomUrlInput(dataUrl);
      }
    };
    reader.onerror = () => {
      setUploadError('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (!selectedUrl.trim()) return;
    onSavePhoto(driver.id, selectedUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Prompt'] text-slate-900 flex items-center gap-2">
                <span>เปลี่ยนรูปถ่ายสารถี</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                  {driver.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เบอร์โทร: {driver.phone} • ใบขับขี่: {driver.licenseNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-200 shrink-0 shadow-md group">
            <img
              src={selectedUrl}
              alt={driver.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = EXPANDED_DRIVER_PRESETS[0].items[0].url;
              }}
            />
            <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              ตัวอย่าง
            </div>
          </div>

          <div className="flex-1 space-y-1.5 w-full text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-bold text-slate-900">{driver.name}</span>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {driver.statusText}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              เลขที่ใบขับขี่: <span className="font-bold text-slate-800">{driver.licenseNumber}</span> | เบอร์โทร: <span className="font-bold text-slate-800">{driver.phone}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              เมื่อกดบันทึก รูปภาพโปรไฟล์สารถีจะแสดงผลทันทีในทำเนียบสารถี, ระบบจองรถ และการติดตามการเดินทาง
            </p>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>คลังภาพสารถีสำเร็จรูป (Presets)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลดรูปจากเครื่อง (Upload)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>ระบุลิงก์ URL รูปภาพ</span>
          </button>
        </div>

        {/* TAB 1: PRESET GALLERY */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {EXPANDED_DRIVER_PRESETS.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCategoryIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedCategoryIdx === idx
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Grid of Preset Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
              {EXPANDED_DRIVER_PRESETS[selectedCategoryIdx].items.map((item, idx) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedUrl(item.url)}
                    className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all p-1.5 cursor-pointer flex flex-col items-center text-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 shrink-0 mx-auto my-1">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                          <Check className="w-5 h-5 drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <div className="pt-1 px-1 pb-1 w-full">
                      <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD IMAGE */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="p-4 rounded-2xl bg-indigo-100 text-indigo-600">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์รูปภาพสารถี หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-[11px] text-slate-500">
                  รองรับไฟล์รูปภาพ JPG, PNG, WEBP จากกล้องมือถือหรือคอมพิวเตอร์ (ไม่เกิน 8MB)
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL ลิงก์รูปภาพสารถี (Direct Image Link)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setSelectedUrl(e.target.value);
                    }}
                    placeholder="https://example.com/driver-profile.jpg"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUrl(customUrlInput)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  โหลดรูป
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                สามารถคัดลอกลิงก์รูปภาพจาก Google หรือแฟ้มบุคลากรมาวางได้โดยตรง
              </p>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>บันทึกรูปภาพสารถี (Save Photo)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
