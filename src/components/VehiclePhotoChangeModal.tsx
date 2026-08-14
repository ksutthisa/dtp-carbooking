import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Link as LinkIcon, 
  Car, 
  RefreshCw,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Vehicle } from '../types';

export interface VehiclePresetCategory {
  category: string;
  items: {
    name: string;
    model: string;
    url: string;
  }[];
}

export const EXPANDED_VEHICLE_PRESETS: VehiclePresetCategory[] = [
  {
    category: '🚐 รถตู้ / Van & VIP',
    items: [
      {
        name: 'Toyota Commuter (สีขาว)',
        model: 'Commuter D4D VIP',
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Toyota Alphard / Vellfire VIP (สีดำ)',
        model: 'Alphard Executive Lounge',
        url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Hyundai Staria VIP (สีเงินเมทัลลิก)',
        model: 'Staria Premium VIP',
        url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Mercedes-Benz V-Class (สีดำหรู)',
        model: 'V250d Exclusive',
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
      },
    ],
  },
  {
    category: '🚗 รถเก๋งซีดาน / Sedan & Executive',
    items: [
      {
        name: 'Toyota Camry (สีดำผู้บริหาร)',
        model: 'Camry 2.5 HEV Premium',
        url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Honda Accord (สีขาวมุก)',
        model: 'Accord e:HEV RS',
        url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Mercedes-Benz E-Class (สีบรอนซ์เงิน)',
        model: 'E 300 e AMG Dynamic',
        url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'BMW 5-Series (สีน้ำเงินเข้ม)',
        model: '530e M Sport',
        url: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&q=80&w=800',
      },
    ],
  },
  {
    category: '⚡ รถยนต์ไฟฟ้า 100% / EV Fleet',
    items: [
      {
        name: 'BYD Seal (สีฟ้า Horizon)',
        model: 'BYD Seal Performance AWD',
        url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Tesla Model 3 / Y (สีขาว Pearl White)',
        model: 'Tesla Model 3 Long Range',
        url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'BYD Atto 3 (สีเขียว Forest)',
        model: 'BYD Atto 3 Extended Range',
        url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'GWM ORA Good Cat (สีทูโทน)',
        model: 'ORA Good Cat 500 Ultra',
        url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=800',
      },
    ],
  },
  {
    category: '🚙 รถ SUV & PPV 7 ที่นั่ง',
    items: [
      {
        name: 'Toyota Fortuner GR Sport (สีดำ)',
        model: 'Fortuner 2.8 GR Sport 4WD',
        url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Ford Everest (สีส้ม/บรอนซ์ Titanium+)',
        model: 'Everest 2.0 Bi-Turbo 4x4',
        url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Honda CR-V (สีบรอนซ์เทา)',
        model: 'CR-V e:HEV RS 4WD',
        url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800',
      },
    ],
  },
  {
    category: '🛻 รถกระบะ 4 ประตู & บัส / Pickup & Bus',
    items: [
      {
        name: 'Isuzu D-Max Cab4 (สีเงิน)',
        model: 'D-Max V-Cross 4x4 3.0',
        url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Toyota Hilux Revo Rocco (สีขาว)',
        model: 'Hilux Revo Double Cab Rocco',
        url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=800',
      },
      {
        name: 'Toyota Coaster VIP Minibus (20 ที่นั่ง)',
        model: 'Coaster 2.8 D4D Minibus',
        url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      },
    ],
  },
];

interface VehiclePhotoChangeModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSaveImage: (vehicleId: string, newImageUrl: string) => void;
}

export const VehiclePhotoChangeModal: React.FC<VehiclePhotoChangeModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onSaveImage,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(vehicle.image);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [customUrlInput, setCustomUrlInput] = useState<string>(vehicle.image);
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
    onSaveImage(vehicle.id, selectedUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Prompt'] text-slate-900 flex items-center gap-2">
                <span>เปลี่ยนรูปภาพยานพาหนะ</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {vehicle.plateNumber.split(' ')[0]}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {vehicle.name} • {vehicle.typeNameTh}
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
          <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 shrink-0 shadow-inner group">
            <img
              src={selectedUrl}
              alt={vehicle.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = EXPANDED_VEHICLE_PRESETS[0].items[0].url;
              }}
            />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              ภาพตัวอย่าง (Preview)
            </div>
          </div>

          <div className="flex-1 space-y-1.5 w-full text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold text-slate-900">{vehicle.name}</span>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {vehicle.typeNameTh}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              ทะเบียน: <span className="font-bold text-slate-800">{vehicle.plateNumber}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              เมื่อกดบันทึก รูปภาพใหม่จะแสดงผลทันทีในระบบจอง, ระบบติดตาม GPS และตารางเดินรถ
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
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>คลังภาพรถมาตรฐาน (Presets)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-blue-600 shadow-xs'
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
                ? 'bg-white text-blue-600 shadow-xs'
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
              {EXPANDED_VEHICLE_PRESETS.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCategoryIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedCategoryIdx === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Grid of Preset Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
              {EXPANDED_VEHICLE_PRESETS[selectedCategoryIdx].items.map((item, idx) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedUrl(item.url)}
                    className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all p-1.5 cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white p-1 rounded-full shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="pt-2 px-1 pb-1">
                      <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.model}</p>
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
                  ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50'
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
              <div className="p-4 rounded-2xl bg-blue-100 text-blue-600">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-[11px] text-slate-500">
                  รองรับไฟล์รูปภาพ JPG, PNG, WEBP จากโทรศัพท์มือถือหรือคอมพิวเตอร์ (ไม่เกิน 8MB)
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
                URL ลิงก์รูปภาพ (Direct Image Link)
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
                    placeholder="https://example.com/car-photo.jpg"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-blue-500 transition-all"
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
                สามารถคัดลอกลิงก์รูปภาพจาก Google, Unsplash, หรือ Cloud Storage มาวางได้โดยตรง
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
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>บันทึกรูปภาพรถ (Save Photo)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
