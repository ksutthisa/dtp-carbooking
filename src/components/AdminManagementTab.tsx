import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Plus, 
  Car, 
  User, 
  ShieldCheck, 
  Check, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Gauge, 
  BatteryCharging, 
  Fuel, 
  Phone, 
  Star, 
  AlertTriangle,
  X,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Camera,
  Upload,
  Bell,
  Send,
  Copy,
  Eye,
  EyeOff,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Vehicle, Driver, BookingRequest } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { getVehicleLiveStatus, getDriverLiveStatus } from '../utils/bookingUtils';
import { 
  getLineConfig, 
  saveLineConfig, 
  sendLineTestMessage, 
  DEFAULT_LINE_TOKEN, 
  DEFAULT_LINE_TARGET_ID,
  LineConfig
} from '../utils/lineNotify';
import { 
  VehiclePhotoChangeModal, 
  EXPANDED_VEHICLE_PRESETS 
} from './VehiclePhotoChangeModal';
import { 
  DriverPhotoChangeModal, 
  EXPANDED_DRIVER_PRESETS 
} from './DriverPhotoChangeModal';

interface AdminManagementTabProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings?: BookingRequest[];
  onAddVehicle: (newVeh: Vehicle) => void;
  onUpdateVehicle: (updatedVeh: Vehicle) => void;
  onDeleteVehicle: (vehId: string) => void;
  onAddDriver: (newDrv: Driver) => void;
  onUpdateDriver: (updatedDrv: Driver) => void;
  onDeleteDriver: (drvId: string) => void;
}

// Preset vehicle images for quick selection
const VEHICLE_PRESET_IMAGES = [
  { name: 'Toyota Commuter (รถตู้)', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600' },
  { name: 'Toyota Camry (ซีดาน)', url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=600' },
  { name: 'BYD Seal / Tesla (EV)', url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600' },
  { name: 'Toyota Fortuner / SUV', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600' },
  { name: 'Isuzu D-Max (กระบะ 4 ประตู)', url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=600' },
];

// Preset driver avatars for quick selection
const DRIVER_PRESET_AVATARS = [
  { name: 'สารถีชาย 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300' },
  { name: 'สารถีชาย 2', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=300' },
  { name: 'สารถีชาย 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300' },
  { name: 'สารถีหญิง 1', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300' },
  { name: 'สารถีหญิง 2', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300' },
];

export const AdminManagementTab: React.FC<AdminManagementTabProps> = ({
  vehicles,
  drivers,
  bookings = [],
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
}) => {
  // Admin View sub-tab
  const [subTab, setSubTab] = useState<'all' | 'vehicles' | 'drivers' | 'line'>('all');

  // LINE Notification Configuration State
  const [lineConfig, setLineConfigState] = useState<LineConfig>(() => getLineConfig());
  const [customToken, setCustomToken] = useState<string>(lineConfig.channelAccessToken || DEFAULT_LINE_TOKEN);
  const [customTargetId, setCustomTargetId] = useState<string>(lineConfig.targetUserId || DEFAULT_LINE_TARGET_ID);
  const [showTokenSecret, setShowTokenSecret] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedTargetId, setCopiedTargetId] = useState<boolean>(false);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testFeedback, setTestFeedback] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  const handleSaveLineConfig = () => {
    const updated: LineConfig = {
      ...lineConfig,
      channelAccessToken: customToken.trim() || DEFAULT_LINE_TOKEN,
      targetUserId: customTargetId.trim() || DEFAULT_LINE_TARGET_ID,
    };
    setLineConfigState(updated);
    saveLineConfig(updated);
    setTestFeedback({
      success: true,
      message: 'บันทึกการตั้งค่า LINE Token และ Target Bot ID สำเร็จ',
      timestamp: new Date().toLocaleTimeString('th-TH')
    });
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleToggleAutoBooking = (val: boolean) => {
    const updated = { ...lineConfig, autoNotifyOnNewBooking: val };
    setLineConfigState(updated);
    saveLineConfig(updated);
  };

  const handleToggleAutoStatus = (val: boolean) => {
    const updated = { ...lineConfig, autoNotifyOnStatusChange: val };
    setLineConfigState(updated);
    saveLineConfig(updated);
  };

  const handleRunLineTest = async () => {
    setTestLoading(true);
    setTestFeedback(null);
    try {
      const res = await sendLineTestMessage(customToken, customTargetId);
      if (res.success) {
        setTestFeedback({
          success: true,
          message: `ส่งข้อความทดสอบเข้า LINE Bot สำเร็จ (ถึง User ID: ${customTargetId})`,
          timestamp: res.timestamp || new Date().toLocaleTimeString('th-TH')
        });
      } else {
        setTestFeedback({
          success: false,
          message: `เกิดข้อผิดพลาดในการส่ง: ${res.error || 'กรุณาตรวจสอบ Token และ Bot ID'}`,
          timestamp: new Date().toLocaleTimeString('th-TH')
        });
      }
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: `ส่งไม่สำเร็จ: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('th-TH')
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Search queries
  const [vehSearch, setVehSearch] = useState('');
  const [drvSearch, setDrvSearch] = useState('');

  // Modals state
  const [showVehModal, setShowVehModal] = useState(false);
  const [editingVeh, setEditingVeh] = useState<Vehicle | null>(null);
  const [changingPhotoVeh, setChangingPhotoVeh] = useState<Vehicle | null>(null);

  const [showDrvModal, setShowDrvModal] = useState(false);
  const [editingDrv, setEditingDrv] = useState<Driver | null>(null);
  const [changingPhotoDrv, setChangingPhotoDrv] = useState<Driver | null>(null);

  // Delete Confirmations
  const [deletingVehId, setDeletingVehId] = useState<string | null>(null);
  const [deletingDrvId, setDeletingDrvId] = useState<string | null>(null);

  // Vehicle Form State
  const [vehName, setVehName] = useState('');
  const [vehPlate, setVehPlate] = useState('');
  const [vehType, setVehType] = useState<'van' | 'sedan' | 'ev' | 'suv' | 'pickup'>('van');
  const [vehCapacity, setVehCapacity] = useState(9);
  const [vehFuel, setVehFuel] = useState('ดีเซล (B7)');
  const [vehImage, setVehImage] = useState(EXPANDED_VEHICLE_PRESETS[0].items[0].url);
  const [vehStatus, setVehStatus] = useState<'available' | 'in_use' | 'maintenance'>('available');
  const [vehLocation, setVehLocation] = useState('จอดสแตนด์บาย ณ ลานจอดส่วนกลาง อาคาร 1');
  const [vehBatteryFuel, setVehBatteryFuel] = useState(100);
  const [vehMileage, setVehMileage] = useState(12500);
  const [vehAssignedDriver, setVehAssignedDriver] = useState('');

  // File input refs for add/edit modal
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const modalDriverFileInputRef = useRef<HTMLInputElement>(null);

  // Handle direct image change for Vehicle
  const handleSaveVehicleImage = (vehId: string, newImageUrl: string) => {
    const target = vehicles.find((v) => v.id === vehId);
    if (target) {
      onUpdateVehicle({
        ...target,
        image: newImageUrl,
      });
    }
  };

  // Handle direct photo change for Driver
  const handleSaveDriverPhoto = (drvId: string, newPhotoUrl: string) => {
    const target = drivers.find((d) => d.id === drvId);
    if (target) {
      onUpdateDriver({
        ...target,
        photo: newPhotoUrl,
      });
    }
  };

  // Handle local file upload in vehicle add/edit form
  const handleModalFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      if (res) setVehImage(res);
    };
    reader.readAsDataURL(file);
  };

  // Handle local file upload in driver add/edit form
  const handleModalDriverFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      if (res) setDrvPhoto(res);
    };
    reader.readAsDataURL(file);
  };

  // Driver Form State
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvLicense, setDrvLicense] = useState('');
  const [drvPhoto, setDrvPhoto] = useState(EXPANDED_DRIVER_PRESETS[0].items[0].url);
  const [drvStatus, setDrvStatus] = useState<'ready' | 'on_duty' | 'leave'>('ready');
  const [drvRating, setDrvRating] = useState(5.0);
  const [drvTrips, setDrvTrips] = useState(0);
  const [drvAssignedVeh, setDrvAssignedVeh] = useState('');

  // Open Vehicle Modal for Create
  const handleOpenAddVehicle = () => {
    setEditingVeh(null);
    setVehName('');
    setVehPlate('');
    setVehType('van');
    setVehCapacity(9);
    setVehFuel('ดีเซล (B7)');
    setVehImage(VEHICLE_PRESET_IMAGES[0].url);
    setVehStatus('available');
    setVehLocation('จอดสแตนด์บาย ณ ลานจอดส่วนกลาง อาคาร 1');
    setVehBatteryFuel(100);
    setVehMileage(12000);
    setVehAssignedDriver('');
    setShowVehModal(true);
  };

  // Open Vehicle Modal for Edit
  const handleOpenEditVehicle = (v: Vehicle) => {
    setEditingVeh(v);
    setVehName(v.name);
    setVehPlate(v.plateNumber);
    setVehType(v.type);
    setVehCapacity(v.capacity);
    setVehFuel(v.fuelType);
    setVehImage(v.image);
    setVehStatus(v.status);
    setVehLocation(v.locationDescription);
    setVehBatteryFuel(v.batteryOrFuel);
    setVehMileage(v.mileageKm);
    setVehAssignedDriver(v.assignedDriverId || '');
    setShowVehModal(true);
  };

  // Save Vehicle (Create or Update)
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehName.trim() || !vehPlate.trim()) return;

    const typeNames: Record<string, string> = {
      van: 'รถตู้ VIP',
      sedan: 'รถเก๋งซีดาน',
      ev: 'รถยนต์ไฟฟ้า EV',
      suv: 'รถ SUV',
      pickup: 'รถกระบะ 4 ประตู',
    };

    if (editingVeh) {
      // Update existing
      const updated: Vehicle = {
        ...editingVeh,
        name: vehName.trim(),
        plateNumber: vehPlate.trim(),
        type: vehType,
        typeNameTh: typeNames[vehType] || 'รถยนต์ส่วนกลาง',
        capacity: Number(vehCapacity) || 4,
        fuelType: vehFuel.trim(),
        image: vehImage,
        status: vehStatus,
        locationDescription: vehLocation.trim(),
        batteryOrFuel: Number(vehBatteryFuel) || 100,
        mileageKm: Number(vehMileage) || 0,
        assignedDriverId: vehAssignedDriver || undefined,
      };
      onUpdateVehicle(updated);
    } else {
      // Create new
      const created: Vehicle = {
        id: `veh-${Date.now()}`,
        name: vehName.trim(),
        plateNumber: vehPlate.trim(),
        type: vehType,
        typeNameTh: typeNames[vehType] || 'รถยนต์ส่วนกลาง',
        capacity: Number(vehCapacity) || 4,
        fuelType: vehFuel.trim(),
        image: vehImage,
        locationDescription: vehLocation.trim() || 'จอดสแตนด์บาย ณ สำนักงานใหญ่',
        status: vehStatus,
        lat: 13.7745 + (Math.random() - 0.5) * 0.05,
        lng: 100.5732 + (Math.random() - 0.5) * 0.05,
        speedKmH: 0,
        heading: Math.floor(Math.random() * 360),
        batteryOrFuel: Number(vehBatteryFuel) || 100,
        mileageKm: Number(vehMileage) || 1000,
        assignedDriverId: vehAssignedDriver || undefined,
      };
      onAddVehicle(created);
    }

    setShowVehModal(false);
  };

  // Open Driver Modal for Create
  const handleOpenAddDriver = () => {
    setEditingDrv(null);
    setDrvName('');
    setDrvPhone('');
    setDrvLicense('');
    setDrvPhoto(DRIVER_PRESET_AVATARS[0].url);
    setDrvStatus('ready');
    setDrvRating(5.0);
    setDrvTrips(0);
    setDrvAssignedVeh('');
    setShowDrvModal(true);
  };

  // Open Driver Modal for Edit
  const handleOpenEditDriver = (d: Driver) => {
    setEditingDrv(d);
    setDrvName(d.name);
    setDrvPhone(d.phone);
    setDrvLicense(d.licenseNumber);
    setDrvPhoto(d.photo);
    setDrvStatus(d.status);
    setDrvRating(d.rating);
    setDrvTrips(d.tripsCompleted);
    setDrvAssignedVeh(d.assignedVehicleId || '');
    setShowDrvModal(true);
  };

  // Save Driver (Create or Update)
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drvName.trim() || !drvPhone.trim()) return;

    const statusTexts: Record<string, string> = {
      ready: 'พร้อมปฏิบัติงาน',
      on_duty: 'กำลังปฏิบัติหน้าที่',
      leave: 'ลาพักงาน/หยุดกะ',
    };

    if (editingDrv) {
      // Update
      const updated: Driver = {
        ...editingDrv,
        name: drvName.trim(),
        phone: drvPhone.trim(),
        photo: drvPhoto,
        licenseNumber: drvLicense.trim() || 'ชข-0000000',
        status: drvStatus,
        statusText: statusTexts[drvStatus] || 'พร้อมปฏิบัติงาน',
        rating: Number(drvRating) || 5.0,
        tripsCompleted: Number(drvTrips) || 0,
        assignedVehicleId: drvAssignedVeh || undefined,
      };
      onUpdateDriver(updated);
    } else {
      // Create
      const created: Driver = {
        id: `drv-${Date.now()}`,
        name: drvName.trim(),
        phone: drvPhone.trim(),
        photo: drvPhoto,
        status: drvStatus,
        statusText: statusTexts[drvStatus] || 'พร้อมปฏิบัติงาน',
        rating: Number(drvRating) || 5.0,
        tripsCompleted: Number(drvTrips) || 0,
        licenseNumber: drvLicense.trim() || 'ชข-9988776',
        assignedVehicleId: drvAssignedVeh || undefined,
      };
      onAddDriver(created);
    }

    setShowDrvModal(false);
  };

  // Filtered lists
  const filteredVehicles = vehicles.filter((v) => {
    const q = vehSearch.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.plateNumber.toLowerCase().includes(q) ||
      v.typeNameTh.toLowerCase().includes(q) ||
      v.fuelType.toLowerCase().includes(q)
    );
  });

  const filteredDrivers = drivers.filter((d) => {
    const q = drvSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.licenseNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-3 sm:px-4 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-['Prompt'] text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            ระบบบริหารจัดการหลังบ้าน (Fleet & Driver Administration)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เพิ่ม ลบ แก้ไข ข้อมูลยานพาหนะ ทะเบียนรถ ทำเนียบสารถี และสถานะการปฏิบัติงาน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-tab switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setSubTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setSubTab('vehicles')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'vehicles' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>ยานพาหนะ ({vehicles.length})</span>
            </button>
            <button
              onClick={() => setSubTab('drivers')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'drivers' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>สารถี ({drivers.length})</span>
            </button>
            <button
              onClick={() => setSubTab('line')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'line' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-emerald-500" />
              <span>แจ้งเตือน LINE</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleOpenAddVehicle}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มยานพาหนะ</span>
          </button>
          <button
            onClick={handleOpenAddDriver}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสารถี</span>
          </button>
        </div>
      </div>

      {/* LINE Bot Notification Settings & Testing Card */}
      {(subTab === 'all' || subTab === 'line') && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-900/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-['Prompt'] text-white">
                    ระบบแจ้งเตือนผ่าน LINE Bot (LINE Messaging API)
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    เชื่อมต่อพร้อมใช้งาน
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ส่งข้อความ Flex Ticket การจองรถเข้า LINE อัตโนมัติเมื่อมีคำขอใหม่และเมื่อสถานะคำขอเปลี่ยนแปลง
                </p>
              </div>
            </div>

            {/* Test Push Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunLineTest}
                disabled={testLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50"
              >
                {testLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังส่งข้อความทดสอบ...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>🚀 ทดสอบส่งเข้า LINE Bot เดี๋ยวนี้</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Feedback Toast / Banner */}
          {testFeedback && (
            <div className={`p-3.5 rounded-2xl text-xs font-medium border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              testFeedback.success 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {testFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testFeedback.message}</span>
              </div>
              {testFeedback.timestamp && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  {testFeedback.timestamp}
                </span>
              )}
            </div>
          )}

          {/* Configuration Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Target Bot / User ID */}
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target LINE User / Bot ID (เพื่อการทดสอบ):</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customTargetId);
                    setCopiedTargetId(true);
                    setTimeout(() => setCopiedTargetId(false), 2000);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedTargetId ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTargetId}
                  onChange={(e) => setCustomTargetId(e.target.value)}
                  placeholder="เช่น U53bc804903a24f5eea308f02793f2306"
                  className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveLineConfig}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                ระบบจะส่งข้อความแจ้งเตือนคำขอใช้รถและข้อความทดสอบไปยัง User ID นี้
              </p>
            </div>

            {/* LINE Channel Access Token */}
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>LINE Channel Access Token:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTokenSecret(!showTokenSecret)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {showTokenSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showTokenSecret ? 'ซ่อน' : 'แสดง'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customToken);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedToken ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type={showTokenSecret ? 'text' : 'password'}
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder="วาง Channel Access Token..."
                  className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveLineConfig}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                โทเค็นสำหรับเชื่อมต่อกับ LINE Messaging API Bot โดยตรง
              </p>
            </div>

          </div>

          {/* Trigger Toggles & Configured Departments */}
          <div className="pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            
            {/* Auto Notify Toggles */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lineConfig.autoNotifyOnNewBooking}
                  onChange={(e) => handleToggleAutoBooking(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                />
                <span className="text-slate-300">แจ้งเตือนอัตโนมัติเมื่อมีคำขอจองใหม่</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lineConfig.autoNotifyOnStatusChange}
                  onChange={(e) => handleToggleAutoStatus(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                />
                <span className="text-slate-300">แจ้งเตือนเมื่ออนุมัติ/เปลี่ยนสถานะ</span>
              </label>
            </div>

            {/* Departments Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-400" />
                หน่วยงานในระบบ (7 ฝ่าย):
              </span>
              {DEPARTMENTS.map((dept) => (
                <span
                  key={dept.id}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 text-[11px] font-bold"
                >
                  {dept.name}
                </span>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* Grid: Vehicles Table & Drivers Table */}
      <div className={`grid grid-cols-1 ${subTab === 'all' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        
        {/* Vehicles Management */}
        {(subTab === 'all' || subTab === 'vehicles') && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Prompt']">
                    รายการยานพาหนะในฟลีท ({vehicles.length} คัน)
                  </h3>
                  <p className="text-[11px] text-slate-500">จัดการข้อมูลรถ ตรวจสอบความพร้อม และแก้ไขสเปก</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={vehSearch}
                    onChange={(e) => setVehSearch(e.target.value)}
                    placeholder="ค้นหาชื่อรถ / ทะเบียน..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none w-44 transition-all"
                  />
                </div>
                <button
                  onClick={handleOpenAddVehicle}
                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                  title="เพิ่มรถใหม่"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vehicles List */}
            <div className="space-y-3">
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  ไม่พบข้อมูลยานพาหนะที่ตรงกับการค้นหา
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const assignedDriver = drivers.find((d) => d.id === v.assignedDriverId);
                  const live = getVehicleLiveStatus(v, bookings);

                  return (
                    <div
                      key={v.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Interactive Vehicle Photo with Hover Camera Badge */}
                        <div 
                          onClick={() => setChangingPhotoVeh(v)}
                          className="relative group/photo cursor-pointer shrink-0"
                          title="คลิกเพื่อเปลี่ยนรูปภาพรถคันนี้"
                        >
                          <img
                            src={v.image}
                            alt={v.name}
                            className="w-16 h-12 object-cover rounded-xl border border-slate-200 shadow-xs transition-transform group-hover/photo:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 text-white rounded-full shadow-xs text-[8px] flex items-center justify-center">
                            <Camera className="w-2.5 h-2.5" />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{v.name}</h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${live.badgeClass}`}>
                              {live.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                            <span className="font-semibold text-slate-800">{v.plateNumber}</span>
                            <span>•</span>
                            <span>{v.typeNameTh} ({v.capacity} ที่นั่ง)</span>
                            <span>•</span>
                            <span className="text-slate-500">{v.fuelType}</span>
                          </p>
                          {live.detail && (
                            <p className="text-[10px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
                              <span>⏰</span>
                              <span>{live.detail}</span>
                            </p>
                          )}
                          {assignedDriver && (
                            <p className="text-[10px] text-blue-600 mt-0.5">
                              สารถีประจำ: {assignedDriver.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <button
                          onClick={() => setChangingPhotoVeh(v)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          title="เปลี่ยนรูปภาพรถคันนี้"
                        >
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>เปลี่ยนรูป</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditVehicle(v)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          title="แก้ไขข้อมูลรถ"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          onClick={() => setDeletingVehId(v.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                          title="ลบยานพาหนะ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Drivers Management */}
        {(subTab === 'all' || subTab === 'drivers') && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Prompt']">
                    ทำเนียบสารถีและพนักงานขับรถ ({drivers.length} ท่าน)
                  </h3>
                  <p className="text-[11px] text-slate-500">จัดการประวัติสารถี เบอร์ติดต่อ และใบขับขี่</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={drvSearch}
                    onChange={(e) => setDrvSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ / เบอร์โทร..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none w-44 transition-all"
                  />
                </div>
                <button
                  onClick={handleOpenAddDriver}
                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
                  title="เพิ่มสารถีใหม่"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drivers List */}
            <div className="space-y-3">
              {filteredDrivers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  ไม่พบข้อมูลสารถีที่ตรงกับการค้นหา
                </div>
              ) : (
                filteredDrivers.map((d) => {
                  const assignedVeh = vehicles.find((v) => v.id === d.assignedVehicleId);
                  const live = getDriverLiveStatus(d, bookings);

                  return (
                    <div
                      key={d.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Interactive Driver Avatar with Camera Badge */}
                        <div
                          onClick={() => setChangingPhotoDrv(d)}
                          className="relative group/drvPhoto cursor-pointer shrink-0"
                          title="คลิกเพื่อเปลี่ยนรูปถ่ายสารถีท่านนี้"
                        >
                          <img
                            src={d.photo}
                            alt={d.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs transition-transform group-hover/drvPhoto:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/drvPhoto:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera className="w-3.5 h-3.5" />
                          </div>
                          <span className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 text-white rounded-full shadow-xs text-[7px] flex items-center justify-center">
                            <Camera className="w-2 h-2" />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{d.name}</h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${live.badgeClass}`}>
                              {live.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                            <span className="font-semibold text-slate-800">โทร: {d.phone}</span>
                            <span>•</span>
                            <span className="text-slate-500">ใบขับขี่: {d.licenseNumber}</span>
                            <span>•</span>
                            <span className="text-amber-500 font-bold">★ {d.rating}</span>
                          </p>
                          {live.detail && (
                            <p className="text-[10px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
                              <span>⏰</span>
                              <span>{live.detail}</span>
                            </p>
                          )}
                          {assignedVeh && (
                            <p className="text-[10px] text-indigo-600 mt-0.5">
                              รถประจำ: {assignedVeh.name.split(' ')[0]} ({assignedVeh.plateNumber.split(' ')[0]})
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <button
                          onClick={() => setChangingPhotoDrv(d)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          title="เปลี่ยนรูปถ่ายสารถี"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          <span>เปลี่ยนรูป</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditDriver(d)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          title="แก้ไขข้อมูลสารถี"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          onClick={() => setDeletingDrvId(d.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                          title="ลบสารถี"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* ===================== VEHICLE MODAL (ADD / EDIT) ===================== */}
      {showVehModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Prompt'] text-slate-900">
                    {editingVeh ? 'แก้ไขข้อมูลยานพาหนะ' : 'เพิ่มยานพาหนะใหม่เข้าฟลีท'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingVeh ? `กำลังแก้ไข ID: ${editingVeh.id}` : 'กรอกรายละเอียดรถเพื่อบรรจุเข้าสู่ระบบฟลีท'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVehModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
              
              {/* Row 1: Name & Plate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อเรียกและรุ่นรถ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehName}
                    onChange={(e) => setVehName(e.target.value)}
                    placeholder="เช่น รถตู้ VIP นค-9765-อย. (จุ 9 ท่าน)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    เลขทะเบียนและจังหวัด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehPlate}
                    onChange={(e) => setVehPlate(e.target.value)}
                    placeholder="เช่น นค-9765 พระนครศรีอยุธยา"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Type, Capacity, Fuel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ประเภทรถ</label>
                  <select
                    value={vehType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setVehType(val);
                      if (val === 'van') setVehCapacity(9);
                      else if (val === 'sedan' || val === 'ev') setVehCapacity(4);
                      else if (val === 'suv') setVehCapacity(7);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  >
                    <option value="van">รถตู้ (Van)</option>
                    <option value="sedan">รถเก๋งซีดาน (Sedan)</option>
                    <option value="ev">รถยนต์ไฟฟ้า (EV)</option>
                    <option value="suv">รถ SUV / PPV</option>
                    <option value="pickup">รถกระบะ 4 ประตู</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ความจุผู้โดยสาร (ท่าน)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={vehCapacity}
                    onChange={(e) => setVehCapacity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ประเภทเชื้อเพลิง/พลังงาน</label>
                  <input
                    type="text"
                    value={vehFuel}
                    onChange={(e) => setVehFuel(e.target.value)}
                    placeholder="เช่น ดีเซล (B7), ไฟฟ้า 100%"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Row 3: Status & Assigned Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">สถานะรถ</label>
                  <select
                    value={vehStatus}
                    onChange={(e) => setVehStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  >
                    <option value="available">พร้อมใช้งาน (Available)</option>
                    <option value="in_use">กำลังออกปฏิบัติหน้าที่ (In Use)</option>
                    <option value="maintenance">เข้าศูนย์ซ่อมบำรุง / ตรวจสภาพ (Maintenance)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">สารถีประจำรถ (ถ้ามี)</label>
                  <select
                    value={vehAssignedDriver}
                    onChange={(e) => setVehAssignedDriver(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  >
                    <option value="">-- ไม่ระบุ / จัดสรรตามรอบ --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Location Description & Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">จุดจอด / พิกัดสแตนด์บาย</label>
                  <input
                    type="text"
                    value={vehLocation}
                    onChange={(e) => setVehLocation(e.target.value)}
                    placeholder="เช่น จอดสแตนด์บาย ณ ลานจอดส่วนกลาง อาคาร 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ระดับน้ำมัน/แบตเตอรี่ (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vehBatteryFuel}
                    onChange={(e) => setVehBatteryFuel(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Row 5: Vehicle Image URL, File Upload & Preset Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>รูปภาพยานพาหนะ</span>
                  </label>
                  
                  {/* Quick Upload from Device Button */}
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูปจากเครื่อง</span>
                  </button>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleModalFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 shrink-0 shadow-xs group">
                    <img
                      src={vehImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = EXPANDED_VEHICLE_PRESETS[0].items[0].url;
                      }}
                    />
                    <div 
                      onClick={() => modalFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer text-[10px] font-bold"
                    >
                      เปลี่ยน
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={vehImage}
                      onChange={(e) => setVehImage(e.target.value)}
                      placeholder="วาง URL รูปภาพ หรือกดปุ่มอัปโหลดด้านบน..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 outline-none focus:border-blue-500 text-xs font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      สามารถระบุลิงก์รูปภาพ หรือเลือกจากคลังรูปรถด้านล่าง
                    </p>
                  </div>
                </div>

                {/* Preset image buttons grouped */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">เลือกจากคลังรูปรถยอดนิยม:</span>
                  <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {EXPANDED_VEHICLE_PRESETS.flatMap(cat => cat.items).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setVehImage(preset.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          vehImage === preset.url
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVehModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingVeh ? 'บันทึกการแก้ไข' : 'บันทึกยานพาหนะใหม่'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DRIVER MODAL (ADD / EDIT) ===================== */}
      {showDrvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Prompt'] text-slate-900">
                    {editingDrv ? 'แก้ไขข้อมูลสารถี' : 'เพิ่มสารถีใหม่เข้าทำเนียบ'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingDrv ? `กำลังแก้ไข ID: ${editingDrv.id}` : 'กรอกประวัติสารถีเพื่อเริ่มรับงานขับรถ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDrvModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4 text-xs">
              
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อ-นามสกุล สารถี <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={drvName}
                    onChange={(e) => setDrvName(e.target.value)}
                    placeholder="เช่น นายประเทือง เรืองโรจน์"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={drvPhone}
                    onChange={(e) => setDrvPhone(e.target.value)}
                    placeholder="เช่น 083-456-7890"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Row 2: License & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เลขที่ใบอนุญาตขับขี่</label>
                  <input
                    type="text"
                    value={drvLicense}
                    onChange={(e) => setDrvLicense(e.target.value)}
                    placeholder="เช่น ชข-9876543"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">สถานะความพร้อม</label>
                  <select
                    value={drvStatus}
                    onChange={(e) => setDrvStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                  >
                    <option value="ready">พร้อมปฏิบัติงาน (Ready)</option>
                    <option value="on_duty">กำลังปฏิบัติหน้าที่ (On Duty)</option>
                    <option value="leave">ลาพักงาน / หยุดกะ (On Leave)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Assigned Vehicle & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">รถประจำตำแหน่ง (ถ้ามี)</label>
                  <select
                    value={drvAssignedVeh}
                    onChange={(e) => setDrvAssignedVeh(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                  >
                    <option value="">-- ไม่ผูกรถประจำ / หมุนเวียน --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.plateNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">คะแนนประเมิน (Rating)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={drvRating}
                    onChange={(e) => setDrvRating(parseFloat(e.target.value) || 5.0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Row 4: Driver Photo URL, Local Upload & Presets */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>รูปถ่ายสารถี</span>
                  </label>

                  {/* Quick Upload from Device */}
                  <button
                    type="button"
                    onClick={() => modalDriverFileInputRef.current?.click()}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูปจากเครื่อง</span>
                  </button>
                  <input
                    ref={modalDriverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleModalDriverFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-200 shrink-0 shadow-xs group">
                    <img
                      src={drvPhoto}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = EXPANDED_DRIVER_PRESETS[0].items[0].url;
                      }}
                    />
                    <div
                      onClick={() => modalDriverFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer text-[10px] font-bold"
                    >
                      เปลี่ยน
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={drvPhoto}
                      onChange={(e) => setDrvPhoto(e.target.value)}
                      placeholder="วาง URL รูปภาพ หรือกดปุ่มอัปโหลดด้านบน..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 outline-none focus:border-indigo-500 text-xs font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      สามารถระบุลิงก์รูปภาพ หรือเลือกจากคลังรูปโปรไฟล์ด้านล่าง
                    </p>
                  </div>
                </div>

                {/* Preset image buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">เลือกจากคลังรูปสารถียอดนิยม:</span>
                  <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {EXPANDED_DRIVER_PRESETS.flatMap((cat) => cat.items).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDrvPhoto(preset.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          drvPhoto === preset.url
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDrvModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDrv ? 'บันทึกการแก้ไข' : 'บันทึกสารถีใหม่'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE VEHICLE CONFIRMATION ===================== */}
      {deletingVehId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Prompt'] text-slate-900">ยืนยันการลบยานพาหนะ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบรถคันนี้ออกจากระบบฟลีท ข้อมูลที่เกี่ยวข้องจะไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingVehId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteVehicle(deletingVehId);
                  setDeletingVehId(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                ยืนยันลบรถ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE DRIVER CONFIRMATION ===================== */}
      {deletingDrvId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Prompt'] text-slate-900">ยืนยันการลบสารถี?</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบสารถีท่านนี้ออกจากระบบทำเนียบ ข้อมูลประวัติการให้บริการจะถูกยกเลิก
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingDrvId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteDriver(deletingDrvId);
                  setDeletingDrvId(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                ยืนยันลบสารถี
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VEHICLE PHOTO CHANGE MODAL ===================== */}
      {changingPhotoVeh && (
        <VehiclePhotoChangeModal
          vehicle={changingPhotoVeh}
          isOpen={true}
          onClose={() => setChangingPhotoVeh(null)}
          onSaveImage={handleSaveVehicleImage}
        />
      )}

      {/* ===================== DRIVER PHOTO CHANGE MODAL ===================== */}
      {changingPhotoDrv && (
        <DriverPhotoChangeModal
          driver={changingPhotoDrv}
          isOpen={true}
          onClose={() => setChangingPhotoDrv(null)}
          onSavePhoto={handleSaveDriverPhoto}
        />
      )}

    </div>
  );
};

