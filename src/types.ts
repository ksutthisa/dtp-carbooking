export type TabType = 
  | 'booking_form' 
  | 'realtime_tracking' 
  | 'booking_list' 
  | 'schedule' 
  | 'drivers' 
  | 'reports' 
  | 'admin';

export type BookingApprovalStatus = 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected' | 'cancelled';

export interface Vehicle {
  id: string;
  name: string; // e.g. "รถตู้ นค-9765-อย. (จุ 9 ท่าน)"
  plateNumber: string; // e.g. "นค-9765 พระนครศรีอยุธยา"
  type: 'van' | 'sedan' | 'ev' | 'suv' | 'pickup';
  typeNameTh: string; // "รถตู้", "รถเก๋ง", "รถยนต์ไฟฟ้า EV", "รถ SUV"
  capacity: number; // e.g. 9
  fuelType: string; // e.g. "ดีเซล (B7)", "ไฟฟ้า 100% (EV)", "เบนซิน 95", "ไฮบริด (e:HEV)"
  image: string;
  locationDescription: string; // e.g. "กำลังเดินทางบนถนนพหลโยธิน มุ่งหน้าอยุธยา"
  status: 'available' | 'in_use' | 'maintenance';
  lat: number;
  lng: number;
  speedKmH: number;
  heading: number;
  batteryOrFuel: number; // 0 - 100%
  mileageKm: number;
  assignedDriverId?: string;
}

export interface Driver {
  id: string;
  name: string; // e.g. "กัสฯประเทือง"
  phone: string; // e.g. "083-456-7890"
  photo: string;
  status: 'ready' | 'on_duty' | 'leave';
  statusText: string; // e.g. "พร้อมปฏิบัติงาน"
  rating: number;
  tripsCompleted: number;
  licenseNumber: string;
  assignedVehicleId?: string;
}

export interface BookingRequest {
  id: string;
  vehicleId: string;
  driverId: string;
  bookerName: string;
  passengers: number;
  phone: string;
  department: string;
  purpose: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  returnDate: string; // YYYY-MM-DD
  returnTime: string; // HH:mm
  pickupLocation: string;
  destinationLocation: string;
  status: BookingApprovalStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  distanceEstimateKm?: number;
  note?: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface ScheduleEvent {
  id: string;
  bookingId: string;
  vehicleId: string;
  driverId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: BookingApprovalStatus;
  department: string;
}
