import React, { useState, useRef } from 'react';
import { 
  Users, 
  Phone, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Car, 
  Shield, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Check, 
  X,
  AlertTriangle,
  Camera,
  Upload
} from 'lucide-react';
import { Driver, Vehicle, BookingRequest } from '../types';
import { getDriverLiveStatus } from '../utils/bookingUtils';
import { 
  DriverPhotoChangeModal, 
  EXPANDED_DRIVER_PRESETS 
} from './DriverPhotoChangeModal';

interface DriverDirectoryTabProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  bookings?: BookingRequest[];
  onAddDriver?: (newDrv: Driver) => void;
  onUpdateDriver?: (updatedDrv: Driver) => void;
  onDeleteDriver?: (drvId: string) => void;
  isAdmin?: boolean;
}

export const DriverDirectoryTab: React.FC<DriverDirectoryTabProps> = ({
  drivers,
  vehicles,
  bookings = [],
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  isAdmin = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [showDrvModal, setShowDrvModal] = useState(false);
  const [editingDrv, setEditingDrv] = useState<Driver | null>(null);
  const [deletingDrvId, setDeletingDrvId] = useState<string | null>(null);
  const [changingPhotoDrv, setChangingPhotoDrv] = useState<Driver | null>(null);

  // Form states
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvLicense, setDrvLicense] = useState('');
  const [drvPhoto, setDrvPhoto] = useState(EXPANDED_DRIVER_PRESETS[0].items[0].url);
  const [drvStatus, setDrvStatus] = useState<'ready' | 'on_duty' | 'leave'>('ready');
  const [drvRating, setDrvRating] = useState(5.0);
  const [drvTrips, setDrvTrips] = useState(0);
  const [drvAssignedVeh, setDrvAssignedVeh] = useState('');

  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveDriverPhoto = (drvId: string, newPhotoUrl: string) => {
    const target = drivers.find((d) => d.id === drvId);
    if (target && onUpdateDriver) {
      onUpdateDriver({
        ...target,
        photo: newPhotoUrl,
      });
    }
  };

  const handleModalFileUpload = (file: File) => {
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

  const handleOpenAddDriver = () => {
    setEditingDrv(null);
    setDrvName('');
    setDrvPhone('');
    setDrvLicense('');
    setDrvPhoto(EXPANDED_DRIVER_PRESETS[0].items[0].url);
    setDrvStatus('ready');
    setDrvRating(5.0);
    setDrvTrips(0);
    setDrvAssignedVeh('');
    setShowDrvModal(true);
  };

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

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drvName.trim() || !drvPhone.trim()) return;

    const statusTexts: Record<string, string> = {
      ready: 'พร้อมปฏิบัติงาน',
      on_duty: 'กำลังปฏิบัติหน้าที่',
      leave: 'ลาพักงาน/หยุดกะ',
    };

    if (editingDrv) {
      if (onUpdateDriver) {
        onUpdateDriver({
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
        });
      }
    } else {
      if (onAddDriver) {
        onAddDriver({
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
        });
      }
    }

    setShowDrvModal(false);
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;

    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-3 sm:px-4 space-y-5">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-['Prompt'] text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            ระบบทำเนียบสารถีและพนักงานขับรถ (Driver Management)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ข้อมูลการติดต่อ ใบอนุญาตขับขี่ คะแนนการให้บริการ จัดการและแก้ไขข้อมูลสารถี
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-2 rounded-xl border border-blue-100">
            สารถีทั้งหมด: {drivers.length} ท่าน
          </div>

          {onAddDriver && (
            <button
              onClick={handleOpenAddDriver}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสารถีใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อสารถี, เบอร์โทร, ใบขับขี่..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'ready', label: 'พร้อมปฏิบัติงาน' },
            { id: 'on_duty', label: 'กำลังปฏิบัติหน้าที่' },
            { id: 'leave', label: 'ลาพักงาน' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === st.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
            ไม่พบข้อมูลสารถีที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          filteredDrivers.map((drv) => {
            const assignedVeh = vehicles.find((v) => v.id === drv.assignedVehicleId);
            const live = getDriverLiveStatus(drv, bookings);

            return (
              <div key={drv.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4 hover:shadow-xl transition-all flex flex-col justify-between group">
                
                <div className="space-y-4">
                  {/* Top Row: Avatar & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Clickable Driver Photo with Hover Camera Badge */}
                      <div
                        onClick={() => setChangingPhotoDrv(drv)}
                        className="relative group/drvPhoto cursor-pointer shrink-0"
                        title="คลิกเพื่อเปลี่ยนรูปถ่ายสารถีท่านนี้"
                      >
                        <img
                          src={drv.photo}
                          alt={drv.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm transition-transform group-hover/drvPhoto:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/drvPhoto:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 text-white rounded-full shadow-xs text-[8px] flex items-center justify-center">
                          <Camera className="w-2.5 h-2.5" />
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{drv.name}</h3>
                        <p className="text-xs text-slate-500">ใบขับขี่: {drv.licenseNumber}</p>
                        <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs font-bold">
                          <span>★ {drv.rating}</span>
                          <span className="text-slate-400 font-normal">({drv.tripsCompleted} เที่ยว)</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${live.badgeClass}`}>
                      {live.statusLabel}
                    </span>
                  </div>

                  {live.detail && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>{live.detail}</span>
                    </div>
                  )}

                  {/* Assigned Vehicle */}
                  {assignedVeh && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5 text-xs">
                      <Car className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-slate-500 block text-[10px]">รถประจำตำแหน่ง:</span>
                        <p className="font-bold text-slate-800 truncate">{assignedVeh.name.split(' ')[0]} ({assignedVeh.plateNumber.split(' ')[0]})</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Contact & Edit/Delete */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700">{drv.phone}</span>
                    <a
                      href={`tel:${drv.phone}`}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="โทรออก"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>โทร</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setChangingPhotoDrv(drv)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      title="เปลี่ยนรูปถ่ายสารถี"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>เปลี่ยนรูป</span>
                    </button>
                    {onUpdateDriver && (
                      <button
                        onClick={() => handleOpenEditDriver(drv)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="แก้ไขข้อมูลสารถี"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    )}
                    {onDeleteDriver && (
                      <button
                        onClick={() => setDeletingDrvId(drv.id)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="ลบสารถี"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Driver Add/Edit Modal */}
      {showDrvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Prompt'] text-slate-900">
                    {editingDrv ? 'แก้ไขข้อมูลสารถี' : 'เพิ่มสารถีใหม่เข้าทำเนียบ'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingDrv ? `แก้ไขข้อมูล: ${editingDrv.name}` : 'กรอกรายละเอียดสารถีเพื่อบรรจุเข้าสู่ระบบ'}
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เลขที่ใบอนุญาตขับขี่</label>
                  <input
                    type="text"
                    value={drvLicense}
                    onChange={(e) => setDrvLicense(e.target.value)}
                    placeholder="เช่น ชข-9876543"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">สถานะความพร้อม</label>
                  <select
                    value={drvStatus}
                    onChange={(e) => setDrvStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  >
                    <option value="ready">พร้อมปฏิบัติงาน (Ready)</option>
                    <option value="on_duty">กำลังปฏิบัติหน้าที่ (On Duty)</option>
                    <option value="leave">ลาพักงาน / หยุดกะ (On Leave)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">รถประจำตำแหน่ง (ถ้ามี)</label>
                  <select
                    value={drvAssignedVeh}
                    onChange={(e) => setDrvAssignedVeh(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 font-semibold"
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
                    onClick={() => modalFileInputRef.current?.click()}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
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
                      onClick={() => modalFileInputRef.current?.click()}
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

                {/* Preset image buttons grouped */}
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
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDrv ? 'บันทึกการแก้ไข' : 'บันทึกสารถีใหม่'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Driver Confirmation Modal */}
      {deletingDrvId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Prompt'] text-slate-900">ยืนยันการลบสารถี?</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบสารถีท่านนี้ออกจากระบบทำเนียบ ข้อมูลจะไม่สามารถกู้คืนได้
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
                  if (onDeleteDriver) onDeleteDriver(deletingDrvId);
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

