import React, { useState, useMemo } from 'react';
import { 
  Car, 
  User, 
  Phone, 
  Building2, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Users,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Info,
  Camera
} from 'lucide-react';
import { Vehicle, Driver, BookingRequest, Department } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { 
  checkBookingConflict, 
  isVehicleAvailable, 
  isDriverAvailable, 
  BookingTimeRange 
} from '../utils/bookingUtils';
import { VehiclePhotoChangeModal } from './VehiclePhotoChangeModal';

interface BookingFormTabProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: BookingRequest[];
  onSubmitBooking: (bookingData: Omit<BookingRequest, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateVehicle?: (veh: Vehicle) => void;
  onNavigateToTracking?: () => void;
  onNavigateToList?: () => void;
  onOpenLineModal?: () => void;
}

export const BookingFormTab: React.FC<BookingFormTabProps> = ({
  vehicles,
  drivers,
  bookings,
  onSubmitBooking,
  onUpdateVehicle,
  onNavigateToTracking,
  onNavigateToList,
  onOpenLineModal,
}) => {
  const [showPhotoChangeModal, setShowPhotoChangeModal] = useState(false);
  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');
  const [bookerName, setBookerName] = useState<string>('');
  const [passengers, setPassengers] = useState<number>(1);
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('CPAM');
  const [purpose, setPurpose] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>('2026-08-14');
  const [departureTime, setDepartureTime] = useState<string>('09:00');
  const [returnDate, setReturnDate] = useState<string>('2026-08-14');
  const [returnTime, setReturnTime] = useState<string>('17:00');
  const [pickupLocation, setPickupLocation] = useState<string>('สำนักงานใหญ่ DTP ทาวเวอร์ (รัชดาภิเษก)');
  const [destinationLocation, setDestinationLocation] = useState<string>('นิคมอุตสาหกรรมไฮเทค พระนครศรีอยุธยา');

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<BookingRequest | null>(null);

  // Time range object
  const currentTimeRange: BookingTimeRange = useMemo(() => ({
    departureDate,
    departureTime,
    returnDate,
    returnTime,
  }), [departureDate, departureTime, returnDate, returnTime]);

  // Check Conflict for currently selected vehicle and driver
  const conflictResult = useMemo(() => {
    return checkBookingConflict(
      selectedVehicleId,
      selectedDriverId,
      currentTimeRange,
      vehicles,
      drivers,
      bookings
    );
  }, [selectedVehicleId, selectedDriverId, currentTimeRange, vehicles, drivers, bookings]);

  // Selected Object References
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  // Auto-sync driver when vehicle changes if assigned
  const handleVehicleChange = (vehId: string) => {
    setSelectedVehicleId(vehId);
    const targetVeh = vehicles.find((v) => v.id === vehId);
    if (targetVeh?.assignedDriverId) {
      const matchDrv = drivers.find((d) => d.id === targetVeh.assignedDriverId);
      if (matchDrv) setSelectedDriverId(matchDrv.id);
    }
  };

  const handleDriverChange = (drvId: string) => {
    setSelectedDriverId(drvId);
    const targetDrv = drivers.find((d) => d.id === drvId);
    if (targetDrv?.assignedVehicleId) {
      const matchVeh = vehicles.find((v) => v.id === targetDrv.assignedVehicleId);
      if (matchVeh) setSelectedVehicleId(matchVeh.id);
    }
  };

  // Find available alternative vehicles and drivers
  const availableVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === 'maintenance') return false;
      const res = isVehicleAvailable(v.id, currentTimeRange, bookings);
      return res.available;
    });
  }, [vehicles, currentTimeRange, bookings]);

  const availableDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (d.status === 'leave') return false;
      const res = isDriverAvailable(d.id, currentTimeRange, bookings);
      return res.available;
    });
  }, [drivers, currentTimeRange, bookings]);

  // Smart auto-select available vehicle & driver
  const handleAutoSelectAvailable = () => {
    const freeVeh = availableVehicles[0];
    if (freeVeh) {
      setSelectedVehicleId(freeVeh.id);
      if (freeVeh.assignedDriverId) {
        const matchDrv = availableDrivers.find((d) => d.id === freeVeh.assignedDriverId);
        if (matchDrv) {
          setSelectedDriverId(matchDrv.id);
          return;
        }
      }
    }
    const freeDrv = availableDrivers[0];
    if (freeDrv) {
      setSelectedDriverId(freeDrv.id);
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setBookerName('');
    setPassengers(1);
    setPhone('');
    setDepartment('CPAM');
    setPurpose('');
    setDepartureDate('2026-08-14');
    setDepartureTime('09:00');
    setReturnDate('2026-08-14');
    setReturnTime('17:00');
    setPickupLocation('สำนักงานใหญ่ DTP ทาวเวอร์ (รัชดาภิเษก)');
    setDestinationLocation('นิคมอุตสาหกรรมไฮเทค พระนครศรีอยุธยา');
    if (vehicles[0]) setSelectedVehicleId(vehicles[0].id);
    if (drivers[0]) setSelectedDriverId(drivers[0].id);
  };

  // Sample fill helper
  const handleFillSample = () => {
    setBookerName('ดร.สมชาย วิเศษกุล');
    setPassengers(1);
    setPhone('081-234-5678');
    setDepartment('CPAM');
    setPurpose('เดินทางไปตรวจสอบความคืบหน้างานก่อสร้างศูนย์กระจายสินค้าอยุธยา และประชุมร่วมกับทีมวิศวกรโครงการ');
    setDepartureDate('2026-08-14');
    setDepartureTime('09:00');
    setReturnDate('2026-08-14');
    setReturnTime('17:00');
    setPickupLocation('สำนักงานใหญ่ DTP ทาวเวอร์ (รัชดาภิเษก)');
    setDestinationLocation('นิคมอุตสาหกรรมไฮเทค พระนครศรีอยุธยา');
  };

  // Submit Handler with Double-Booking Prevention Check
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookerName.trim()) {
      alert('กรุณาระบุชื่อผู้จอง');
      return;
    }
    if (!department) {
      alert('กรุณาเลือกหน่วยงาน / ฝ่าย');
      return;
    }
    if (!purpose.trim()) {
      alert('กรุณาระบุวัตถุประสงค์การใช้งาน');
      return;
    }

    // Date/time logical check
    const startObj = new Date(`${departureDate}T${departureTime}:00`);
    const endObj = new Date(`${returnDate}T${returnTime}:00`);
    if (endObj <= startObj) {
      alert('วัน-เวลาเดินทางกลับ ต้องอยู่หลังวัน-เวลาออกเดินทาง');
      return;
    }

    // STRICT Double Booking Check
    if (conflictResult.hasConflict) {
      alert(
        `⛔ ไม่สามารถส่งคำขอได้ เนื่องจากมีการจองซ้ำซ้อน:\n\n${conflictResult.details.join('\n')}\n\nกรุณาเลือกรถหรือสารถีคันอื่นที่ว่าง หรือเปลี่ยนช่วงเวลาเดินทาง`
      );
      return;
    }

    const newBookingData = {
      vehicleId: selectedVehicle.id,
      driverId: selectedDriver.id,
      bookerName: bookerName.trim(),
      passengers: Number(passengers) || 1,
      phone: phone.trim() || '081-234-5678',
      department,
      purpose: purpose.trim(),
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      pickupLocation,
      destinationLocation,
      distanceEstimateKm: 58.4,
    };

    onSubmitBooking(newBookingData);

    const nowStr = new Date().toLocaleString('th-TH', { hour12: false });
    const completeRecord: BookingRequest = {
      ...newBookingData,
      id: `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'approved',
      approvedBy: 'ระบบอนุมัติอัตโนมัติ (Auto-Approved)',
      approvedAt: nowStr,
      createdAt: nowStr,
    };

    setCreatedBooking(completeRecord);
    setShowSuccessModal(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-3 sm:px-4">
      
      {/* Form Container Card */}
      <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Card Header Banner */}
        <div className="bg-gradient-to-r from-[#0c1a30] via-[#102a54] to-[#0f172a] text-white p-6 sm:p-8 border-b border-blue-900/40 relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⚡ Instant Auto-Approval
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Prompt'] tracking-tight flex items-center gap-2.5 mt-1.5">
              <FileText className="w-6 h-6 text-blue-400" />
              แบบฟอร์มจองและขอใช้รถยนต์
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-light">
              ระบบตรวจสอบความว่างและอนุมัติการใช้รถให้ทันทีเมื่อรถว่าง พร้อมส่งแจ้งเตือนเข้า LINE Bot
            </p>
          </div>

          <button
            type="button"
            onClick={handleFillSample}
            className="absolute top-6 right-6 text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="กรอกข้อมูลตัวอย่างตามหน้าจอ"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>กรอกตัวอย่าง</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* 1. พาหนะ (Vehicle Section) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-blue-600" />
                <span>พาหนะ (ยานพาหนะ)</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                ความจุสูงสุด: <strong className="text-blue-700">{selectedVehicle?.capacity} ท่าน</strong> ({selectedVehicle?.fuelType})
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 outline-none transition-all shadow-xs cursor-pointer appearance-none pr-10 ${
                  conflictResult.vehicleConflict
                    ? 'border-rose-400 focus:border-rose-600 bg-rose-50/50'
                    : 'border-slate-300 hover:border-slate-400 focus:border-blue-500'
                }`}
              >
                {vehicles.map((v) => {
                  const check = isVehicleAvailable(v.id, currentTimeRange, bookings);
                  let statusTag = '✅ พร้อมใช้งาน';
                  if (v.status === 'maintenance') {
                    statusTag = '🔧 ส่งซ่อมบำรุง';
                  } else if (!check.available && check.conflictBooking) {
                    statusTag = `⛔ ติดคิว (${check.conflictBooking.departureTime}-${check.conflictBooking.returnTime})`;
                  }
                  return (
                    <option key={v.id} value={v.id}>
                      {statusTag} | {v.name}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                ▼
              </div>
            </div>

            {/* Vehicle Detail Preview Box with Conflict Status & Photo Change */}
            {selectedVehicle && (
              <div className={`rounded-xl p-3.5 flex items-center gap-3.5 transition-all border ${
                conflictResult.vehicleConflict
                  ? 'bg-rose-50/90 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div 
                  onClick={() => setShowPhotoChangeModal(true)}
                  className="relative group/bookingPhoto cursor-pointer shrink-0"
                  title="คลิกเพื่อเปลี่ยนรูปภาพรถ"
                >
                  <img
                    src={selectedVehicle.image}
                    alt={selectedVehicle.name}
                    className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-lg border border-slate-200 shadow-xs transition-transform group-hover/bookingPhoto:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/bookingPhoto:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 text-white rounded-full shadow-xs text-[8px] flex items-center justify-center">
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {selectedVehicle.name.split(' ')[0]} {selectedVehicle.plateNumber.split(' ')[0]}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowPhotoChangeModal(true)}
                        className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-semibold flex items-center gap-0.5 shrink-0"
                      >
                        <Camera className="w-3 h-3" />
                        <span>เปลี่ยนรูป</span>
                      </button>
                    </div>

                    {conflictResult.vehicleConflict ? (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> ติดคิวจองซ้ำ
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ว่างพร้อมใช้
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 truncate mt-0.5">
                    ประเภท: {selectedVehicle.typeNameTh} (ทะเบียน: {selectedVehicle.plateNumber})
                  </p>
                  {conflictResult.vehicleConflict ? (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <span>⚠️ ติดคิวจอง:</span>
                      {conflictResult.vehicleConflict.conflictingBooking ? (
                        <span>
                          {conflictResult.vehicleConflict.conflictingBooking.departureTime} - {conflictResult.vehicleConflict.conflictingBooking.returnTime} น. (โดย {conflictResult.vehicleConflict.conflictingBooking.bookerName})
                        </span>
                      ) : (
                        <span>อยู่ระหว่างส่งซ่อมบำรุง</span>
                      )}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">พร้อมให้บริการ ณ: {selectedVehicle.locationDescription}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. สารถี (Driver Section) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>สารถี (พนักงานขับรถ)</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                เบอร์โทร: <strong className="text-blue-700">{selectedDriver?.phone}</strong>
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedDriverId}
                onChange={(e) => handleDriverChange(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 outline-none transition-all shadow-xs cursor-pointer appearance-none pr-10 ${
                  conflictResult.driverConflict
                    ? 'border-rose-400 focus:border-rose-600 bg-rose-50/50'
                    : 'border-slate-300 hover:border-slate-400 focus:border-blue-500'
                }`}
              >
                {drivers.map((d) => {
                  const check = isDriverAvailable(d.id, currentTimeRange, bookings);
                  let statusTag = '✅ พร้อมปฏิบัติงาน';
                  if (d.status === 'leave') {
                    statusTag = '🏖️ ลาพักงาน';
                  } else if (!check.available && check.conflictBooking) {
                    statusTag = `⛔ ติดภารกิจ (${check.conflictBooking.departureTime}-${check.conflictBooking.returnTime})`;
                  }
                  return (
                    <option key={d.id} value={d.id}>
                      {statusTag} | {d.name} ({d.phone})
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                ▼
              </div>
            </div>

            {/* Driver Detail Preview Box with Conflict Status */}
            {selectedDriver && (
              <div className={`rounded-xl p-3.5 flex items-center gap-3.5 transition-all border ${
                conflictResult.driverConflict
                  ? 'bg-rose-50/90 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <img
                  src={selectedDriver.photo}
                  alt={selectedDriver.name}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-slate-200 shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      สารถี: {selectedDriver.name}
                    </h4>
                    {conflictResult.driverConflict ? (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> ติดภารกิจซ้ำ
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> พร้อมปฏิบัติงาน
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    สถานะ: <span className="font-semibold text-slate-800">{selectedDriver.statusText}</span> (ใบขับขี่: {selectedDriver.licenseNumber})
                  </p>
                  {conflictResult.driverConflict && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <span>⚠️ สารถีติดภารกิจ:</span>
                      {conflictResult.driverConflict.conflictingBooking ? (
                        <span>
                          {conflictResult.driverConflict.conflictingBooking.departureTime} - {conflictResult.driverConflict.conflictingBooking.returnTime} น. (โดย {conflictResult.driverConflict.conflictingBooking.bookerName})
                        </span>
                      ) : (
                        <span>ลาพักงาน/หยุดกะ</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Booker Name & Passenger Count (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* ชื่อผู้จอง */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>ชื่อผู้จอง</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                placeholder="เช่น ดร.สมชาย วิเศษกุล"
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>

            {/* จำนวนผู้โดยสาร */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>จำนวนผู้โดยสาร</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={selectedVehicle?.capacity || 9}
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition-all pr-12"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                  คน
                </span>
              </div>
            </div>

          </div>

          {/* 4. Phone & Department (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* เบอร์โทรศัพท์ติดต่อ */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>เบอร์โทรศัพท์ติดต่อ</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* หน่วยงาน / ฝ่าย */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>หน่วยงาน / ฝ่าย</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 outline-none transition-all shadow-xs cursor-pointer appearance-none pr-10"
                  required
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.code}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                  ▼
                </div>
              </div>
            </div>

          </div>

          {/* 5. สถานที่ขึ้นรถ และ ปลายทาง */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>สถานที่ขึ้นรถ (จุดรับ)</span>
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="เช่น สำนักงานใหญ่ DTP ทาวเวอร์"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>สถานที่ปลายทาง (จุดส่ง)</span>
              </label>
              <input
                type="text"
                value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                placeholder="เช่น นิคมอุตสาหกรรมไฮเทค พระนครศรีอยุธยา"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 6. ใช้เพื่อ (วัตถุประสงค์การใช้งาน) */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>ใช้เพื่อ (วัตถุประสงค์การใช้งาน)</span>
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="ระบุวัตถุประสงค์ รายละเอียดสถานที่ และการปฏิบัติงาน..."
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 resize-y"
              required
            />
          </div>

          {/* 7. วันที่และเวลาออกเดินทาง vs วันที่และเวลาเดินทางกลับ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* วันที่และเวลาออกเดินทาง */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>วันที่และเวลาออกเดินทาง</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* วันที่และเวลาเดินทางกลับ */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>วันที่และเวลาเดินทางกลับ</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

          </div>

          {/* 8. Conflict Detection & Smart Verification Status Banner */}
          <div className="pt-2">
            {conflictResult.hasConflict ? (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 text-rose-900 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold font-['Prompt'] text-rose-900 flex items-center gap-1.5">
                        <span>ไม่สามารถจองได้: พบการจองซ้ำซ้อนในช่วงเวลาดังกล่าว (Booking Collision)</span>
                      </h4>
                      <p className="text-xs text-rose-700 mt-0.5">
                        ระบบตรวจพบว่ายานพาหนะหรือสารถีที่ท่านเลือกมีภารกิจอื่นแล้ว ไม่สามารถทำการจองซ้อนได้
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conflict Detail Items */}
                <div className="bg-white/80 rounded-xl p-3 border border-rose-200 space-y-1.5 text-xs text-rose-800">
                  {conflictResult.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                {/* One-click resolution */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-rose-200/60">
                  <span className="text-xs text-rose-700 font-medium">
                    มีรถว่างพร้อมใช้งาน {availableVehicles.length} คัน | สารถีว่าง {availableDrivers.length} ท่าน
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoSelectAvailable}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>สลับไปใช้รถและสารถีที่ว่างทันที</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      ช่วงเวลาพร้อมจัดสรร (No Conflict Detected)
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {selectedVehicle?.name.split(' ')[0]} และ สารถี {selectedDriver?.name} ว่างตลอดช่วง {departureTime} - {returnTime} น.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-mono font-semibold text-emerald-800 bg-white/70 px-2.5 py-1 rounded-lg border border-emerald-200 text-center">
                  รถว่าง {availableVehicles.length} คัน / สารถีว่าง {availableDrivers.length} ท่าน
                </div>
              </div>
            )}
          </div>

          {/* Form Action Buttons (Exact layout as screenshot) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              {conflictResult.hasConflict ? (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  กรุณาแก้ไขการจองซ้ำก่อนกดยืนยัน
                </span>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ข้อมูลถูกต้อง พร้อมส่งขออนุมัติ
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                ล้างข้อมูล
              </button>
              <button
                type="submit"
                disabled={conflictResult.hasConflict}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                  conflictResult.hasConflict
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-98'
                }`}
                title={conflictResult.hasConflict ? 'ไม่สามารถส่งได้เนื่องจากมีการจองซ้ำ' : 'ยืนยันการจองรถ (อนุมัติทันที)'}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันการจองรถ (อนุมัติทันที)</span>
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* Success Booking Modal / e-Ticket Voucher */}
      {showSuccessModal && createdBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-['Prompt'] text-slate-900">
                อนุมัติการจองรถสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                รหัสคำขอ: <strong className="text-blue-600 font-bold">{createdBooking.id}</strong> • <span className="text-emerald-600 font-semibold">อนุมัติอัตโนมัติ (พร้อมเดินทาง)</span>
              </p>
            </div>

            {/* Ticket Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">ผู้ขอใช้รถ:</span>
                <span className="font-bold text-slate-800">{createdBooking.bookerName} ({createdBooking.department})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">ยานพาหนะ:</span>
                <span className="font-bold text-blue-700">{selectedVehicle?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">สารถีผู้ขับขี่:</span>
                <span className="font-bold text-slate-800">{selectedDriver?.name} ({selectedDriver?.phone})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">วัน-เวลาเดินทาง:</span>
                <span className="font-semibold text-slate-800">{createdBooking.departureDate} เวลา {createdBooking.departureTime} น.</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">จุดรับ - ปลายทาง:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[65%]">{createdBooking.pickupLocation || 'สำนักงานใหญ่'} ➔ {createdBooking.destinationLocation}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">วัตถุประสงค์การใช้งาน:</span>
                <span className="font-bold text-blue-700 text-right max-w-[65%]">{createdBooking.purpose}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">สถานะคำขอ:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> อนุมัติแล้ว (Approved)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5 bg-emerald-50 -mx-2 -mb-1 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>ระบบส่งข้อความแจ้งเตือนอนุมัติไปยัง LINE Bot เรียบร้อยแล้ว</span>
                  </div>
                  {onOpenLineModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuccessModal(false);
                        onOpenLineModal();
                      }}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-bold cursor-pointer"
                    >
                      ตรวจสอบสถานะ LINE
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-emerald-600 font-normal">
                  * หากไม่ได้รับข้อความ กรุณาตรวจสอบว่าได้เพิ่มเพื่อนกับ Bot และใส่ User ID/Group ID ถูกต้อง
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigateToList) onNavigateToList();
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                ดูรายการจองของฉัน
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigateToTracking) onNavigateToTracking();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                ดูพิกัดรถบน GPS แผนที่
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-medium text-xs transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Vehicle Photo Change Modal from Booking Form */}
      {selectedVehicle && (
        <VehiclePhotoChangeModal
          vehicle={selectedVehicle}
          isOpen={showPhotoChangeModal}
          onClose={() => setShowPhotoChangeModal(false)}
          onSaveImage={(vehId, newUrl) => {
            if (onUpdateVehicle) {
              onUpdateVehicle({
                ...selectedVehicle,
                image: newUrl,
              });
            }
          }}
        />
      )}

    </div>
  );
};
