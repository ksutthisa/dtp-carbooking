import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BookingFormTab } from './components/BookingFormTab';
import { RealtimeTrackingTab } from './components/RealtimeTrackingTab';
import { BookingListTab } from './components/BookingListTab';
import { ScheduleTab } from './components/ScheduleTab';
import { DriverDirectoryTab } from './components/DriverDirectoryTab';
import { ReportsTab } from './components/ReportsTab';
import { AdminManagementTab } from './components/AdminManagementTab';
import { LineNotificationModal } from './components/LineNotificationModal';

import { 
  TabType, 
  Vehicle, 
  Driver, 
  BookingRequest, 
  BookingApprovalStatus 
} from './types';

import { 
  INITIAL_VEHICLES, 
  INITIAL_DRIVERS, 
  INITIAL_BOOKINGS 
} from './data/mockData';
import { checkBookingConflict, formatThaiDate } from './utils/bookingUtils';
import { 
  sendLineBookingNotification, 
  sendLineStatusNotification,
  sendLineDepartureReminder 
} from './utils/lineNotify';

export function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<TabType>('booking_form');
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'driver'>('admin');
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  // Master Data State (Persisted in localStorage if available)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('dtp_vehicles');
    let list: Vehicle[] = saved ? JSON.parse(saved) : INITIAL_VEHICLES;
    // Ensure all default vehicles exist (e.g. pickup truck veh-06)
    INITIAL_VEHICLES.forEach((initV) => {
      const idx = list.findIndex((v) => v.id === initV.id);
      if (idx === -1) {
        list.push(initV);
      } else {
        // Keep updated data properties if needed
        list[idx] = { ...initV, ...list[idx] };
      }
    });
    return list;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('dtp_drivers');
    let list: Driver[] = saved ? JSON.parse(saved) : INITIAL_DRIVERS;
    // Ensure all default drivers exist (e.g. drv-06)
    INITIAL_DRIVERS.forEach((initD) => {
      const idx = list.findIndex((d) => d.id === initD.id);
      if (idx === -1) {
        list.push(initD);
      } else {
        list[idx] = { ...initD, ...list[idx] };
      }
    });
    return list;
  });

  const [bookings, setBookings] = useState<BookingRequest[]>(() => {
    const saved = localStorage.getItem('dtp_bookings');
    let list: BookingRequest[] = saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    // Ensure default initial bookings exist (e.g. multi-day pickup truck booking BK-2026-0813-03)
    INITIAL_BOOKINGS.forEach((initB) => {
      if (!list.some((b) => b.id === initB.id)) {
        list.push(initB);
      }
    });
    return list;
  });

  // Dynamic status synchronization between active bookings and vehicles/drivers
  useEffect(() => {
    setVehicles((prevVehicles) => {
      let changed = false;
      const updated = prevVehicles.map((v) => {
        if (v.status === 'maintenance') return v;
        const activeB = bookings.find(
          (b) => b.vehicleId === v.id && (b.status === 'approved' || b.status === 'in_transit')
        );
        const targetStatus = activeB ? 'in_use' : 'available';
        if (v.status !== targetStatus) {
          changed = true;
          return { ...v, status: targetStatus };
        }
        return v;
      });
      return changed ? updated : prevVehicles;
    });

    setDrivers((prevDrivers) => {
      let changed = false;
      const updated = prevDrivers.map((d) => {
        if (d.status === 'leave') return d;
        const activeB = bookings.find(
          (b) => b.driverId === d.id && (b.status === 'approved' || b.status === 'in_transit')
        );
        const targetStatus = activeB ? 'on_duty' : 'ready';
        const targetText = activeB
          ? `ติดงานถึง ${formatThaiDate(activeB.returnDate)}`
          : 'พร้อมปฏิบัติงาน';
        if (d.status !== targetStatus || (activeB && d.statusText !== targetText)) {
          changed = true;
          return { ...d, status: targetStatus, statusText: targetText };
        }
        return d;
      });
      return changed ? updated : prevDrivers;
    });
  }, [bookings]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dtp_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('dtp_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('dtp_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // Automated 1-Hour Pre-Departure Reminder Check (runs periodically)
  useEffect(() => {
    const checkDepartureReminders = () => {
      const now = new Date();
      bookings.forEach((b) => {
        // Only active/approved trips that haven't sent a reminder yet
        if ((b.status === 'approved' || b.status === 'in_transit') && !b.reminderSent) {
          try {
            const departureDateTime = new Date(`${b.departureDate}T${b.departureTime}:00`);
            const diffMs = departureDateTime.getTime() - now.getTime();
            const diffMinutes = diffMs / (1000 * 60);

            // Within 60 minutes before departure (and departure is within recent/future window)
            if (diffMinutes > -10 && diffMinutes <= 60) {
              // Mark reminder as sent
              setBookings((prev) =>
                prev.map((item) =>
                  item.id === b.id
                    ? { ...item, reminderSent: true, reminderSentAt: new Date().toLocaleString('th-TH', { hour12: false }) }
                    : item
                )
              );

              const matchedVeh = vehicles.find((v) => v.id === b.vehicleId);
              const matchedDrv = drivers.find((d) => d.id === b.driverId);
              sendLineDepartureReminder(b, matchedVeh, matchedDrv).then((res) => {
                if (res.success) {
                  showToast(`⏰ ส่งแจ้งเตือนก่อนออกเดินทาง 1 ชม. เข้า LINE สำเร็จ (${b.id})`);
                }
              });
            }
          } catch (err) {
            console.error('Error checking departure reminder for booking', b.id, err);
          }
        }
      });
    };

    checkDepartureReminders();
    const interval = setInterval(checkDepartureReminders, 30000);
    return () => clearInterval(interval);
  }, [bookings, vehicles, drivers]);

  // Manual Trigger for 1-Hour Departure Reminder
  const handleSendDepartureReminder = async (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    const matchedVeh = vehicles.find((v) => v.id === targetBooking.vehicleId);
    const matchedDrv = drivers.find((d) => d.id === targetBooking.driverId);

    setBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId
          ? { ...item, reminderSent: true, reminderSentAt: new Date().toLocaleString('th-TH', { hour12: false }) }
          : item
      )
    );

    const res = await sendLineDepartureReminder(targetBooking, matchedVeh, matchedDrv);
    if (res.success) {
      showToast(`⏰ แจ้งเตือนก่อนออกเดินทาง 1 ชม. เข้า LINE สำเร็จ (${bookingId})`);
    } else {
      showToast(`❌ ส่งแจ้งเตือนไม่สำเร็จ: ${res.error}`);
    }
  };

  // Handle New Booking Creation (No approval / no dispatch needed: Ready immediately!)
  const handleCreateBooking = (bookingData: Omit<BookingRequest, 'id' | 'createdAt' | 'status'>) => {
    // Conflict guard
    const conflict = checkBookingConflict(
      bookingData.vehicleId,
      bookingData.driverId,
      {
        departureDate: bookingData.departureDate,
        departureTime: bookingData.departureTime,
        returnDate: bookingData.returnDate,
        returnTime: bookingData.returnTime,
      },
      vehicles,
      drivers,
      bookings
    );

    if (conflict.hasConflict) {
      showToast(`⛔ ไม่สามารถจองได้เนื่องจากรถหรือสารถีติดภารกิจซ้ำซ้อน`);
      return;
    }

    const newId = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowTimeStr = new Date().toLocaleString('th-TH', { hour12: false });
    const newBooking: BookingRequest = {
      ...bookingData,
      id: newId,
      status: 'approved',
      approvedBy: 'ระบบยืนยันอัตโนมัติ (พร้อมเดินทางทันที)',
      approvedAt: nowTimeStr,
      createdAt: nowTimeStr,
      reminderSent: false,
    };

    setBookings((prev) => [newBooking, ...prev]);
    showToast(`✅ จองการใช้รถหมายเลข ${newId} สำเร็จเรียบร้อย (พร้อมออกเดินทางทันที)`);

    // Dispatch LINE push notification immediately on booking/departure confirmation
    const matchedVeh = vehicles.find((v) => v.id === newBooking.vehicleId);
    const matchedDrv = drivers.find((d) => d.id === newBooking.driverId);
    sendLineBookingNotification(newBooking, matchedVeh, matchedDrv).then((res) => {
      if (res.success) {
        showToast(`📲 แจ้งเตือนยืนยันการใช้รถเข้า LINE Bot สำเร็จ (${newId})`);
      } else {
        console.warn('LINE notification warning:', res.error);
      }
    });
  };

  // Handle Status Updates (Approve, Reject, In-transit, Complete)
  const handleUpdateBookingStatus = (bookingId: string, newStatus: BookingApprovalStatus) => {
    // If approving, check if this creates a conflict with an already approved or in_transit trip
    if (newStatus === 'approved' || newStatus === 'in_transit') {
      const targetB = bookings.find((b) => b.id === bookingId);
      if (targetB) {
        const approvedConflict = checkBookingConflict(
          targetB.vehicleId,
          targetB.driverId,
          {
            departureDate: targetB.departureDate,
            departureTime: targetB.departureTime,
            returnDate: targetB.returnDate,
            returnTime: targetB.returnTime,
          },
          vehicles,
          drivers,
          bookings.filter((b) => b.status === 'approved' || b.status === 'in_transit'),
          bookingId
        );

        if (approvedConflict.hasConflict) {
          showToast(`⚠️ คำเตือน: อนุมัติซ้ำซ้อนกับคำขอที่ได้รับการอนุมัติแล้ว!`);
        }
      }
    }

    const currentBooking = bookings.find((b) => b.id === bookingId);

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: newStatus,
            approvedBy: newStatus === 'approved' ? 'Admin (คุณศิริพร บุญเกิด)' : b.approvedBy,
            approvedAt: newStatus === 'approved' ? new Date().toLocaleString('th-TH', { hour12: false }) : b.approvedAt,
          };
        }
        return b;
      })
    );

    // Dispatch status change notification to LINE
    if (currentBooking) {
      const matchedVeh = vehicles.find((v) => v.id === currentBooking.vehicleId);
      const matchedDrv = drivers.find((d) => d.id === currentBooking.driverId);
      sendLineStatusNotification({ ...currentBooking, status: newStatus }, newStatus, matchedVeh, matchedDrv);
    }

    const statusNames: { [key in BookingApprovalStatus]: string } = {
      pending: 'รอการอนุมัติ',
      approved: 'อนุมัติเรียบร้อยแล้ว',
      in_transit: 'ปล่อยรถออกเดินทางแล้ว',
      completed: 'เสร็จสิ้นการเดินทาง',
      rejected: 'ปฏิเสธคำขอแล้ว',
      cancelled: 'ยกเลิกคำขอแล้ว',
    };

    showToast(`อัปเดตสถานะคำขอ ${bookingId} เป็น: ${statusNames[newStatus]}`);
  };

  // Add Vehicle
  const handleAddVehicle = (newVeh: Vehicle) => {
    setVehicles((prev) => [...prev, newVeh]);
    showToast(`เพิ่มยานพาหนะ ${newVeh.name} สำเร็จ`);
  };

  // Update Vehicle
  const handleUpdateVehicle = (updatedVeh: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v.id === updatedVeh.id ? updatedVeh : v)));
    showToast(`บันทึกการแก้ไขข้อมูลรถ ${updatedVeh.name} สำเร็จ`);
  };

  // Delete Vehicle
  const handleDeleteVehicle = (vehId: string) => {
    const targetVeh = vehicles.find((v) => v.id === vehId);
    setVehicles((prev) => prev.filter((v) => v.id !== vehId));
    // Also unassign from drivers if any driver had this vehicle
    setDrivers((prev) =>
      prev.map((d) => (d.assignedVehicleId === vehId ? { ...d, assignedVehicleId: undefined } : d))
    );
    showToast(`ลบยานพาหนะ ${targetVeh?.name || vehId} ออกจากระบบเรียบร้อย`);
  };

  // Add Driver
  const handleAddDriver = (newDrv: Driver) => {
    setDrivers((prev) => [...prev, newDrv]);
    showToast(`เพิ่มสารถี ${newDrv.name} สำเร็จ`);
  };

  // Update Driver
  const handleUpdateDriver = (updatedDrv: Driver) => {
    setDrivers((prev) => prev.map((d) => (d.id === updatedDrv.id ? updatedDrv : d)));
    showToast(`บันทึกการแก้ไขข้อมูลสารถี ${updatedDrv.name} สำเร็จ`);
  };

  // Delete Driver
  const handleDeleteDriver = (drvId: string) => {
    const targetDrv = drivers.find((d) => d.id === drvId);
    setDrivers((prev) => prev.filter((d) => d.id !== drvId));
    showToast(`ลบสารถี ${targetDrv?.name || drvId} ออกจากทำเนียบเรียบร้อย`);
  };

  // Reset to Factory Default
  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setVehicles(INITIAL_VEHICLES);
      setDrivers(INITIAL_DRIVERS);
      setBookings(INITIAL_BOOKINGS);
      localStorage.removeItem('dtp_vehicles');
      localStorage.removeItem('dtp_drivers');
      localStorage.removeItem('dtp_bookings');
      showToast('รีเซ็ตข้อมูลระบบกลับเป็นค่าเริ่มต้นเรียบร้อย');
    }
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-['Sarabun',sans-serif] flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Header and Navigation Tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        onResetData={handleResetData}
        pendingCount={pendingCount}
        onOpenLineModal={() => setIsLineModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-12">
        {activeTab === 'booking_form' && (
          <BookingFormTab
            vehicles={vehicles}
            drivers={drivers}
            bookings={bookings}
            onSubmitBooking={handleCreateBooking}
            onUpdateVehicle={handleUpdateVehicle}
            onNavigateToTracking={() => setActiveTab('realtime_tracking')}
            onNavigateToList={() => setActiveTab('booking_list')}
            onOpenLineModal={() => setIsLineModalOpen(true)}
          />
        )}

        {activeTab === 'realtime_tracking' && (
          <RealtimeTrackingTab
            vehicles={vehicles}
            drivers={drivers}
            bookings={bookings}
          />
        )}

        {activeTab === 'booking_list' && (
          <BookingListTab
            bookings={bookings}
            vehicles={vehicles}
            drivers={drivers}
            userRole={userRole}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onSendDepartureReminder={handleSendDepartureReminder}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab
            vehicles={vehicles}
            bookings={bookings}
            drivers={drivers}
          />
        )}

        {activeTab === 'drivers' && (
          <DriverDirectoryTab
            drivers={drivers}
            vehicles={vehicles}
            bookings={bookings}
            onAddDriver={handleAddDriver}
            onUpdateDriver={handleUpdateDriver}
            onDeleteDriver={handleDeleteDriver}
            isAdmin={userRole === 'admin'}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            bookings={bookings}
            vehicles={vehicles}
            drivers={drivers}
          />
        )}

        {activeTab === 'admin' && (
          <AdminManagementTab
            vehicles={vehicles}
            drivers={drivers}
            bookings={bookings}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onAddDriver={handleAddDriver}
            onUpdateDriver={handleUpdateDriver}
            onDeleteDriver={handleDeleteDriver}
          />
        )}
      </main>

      {/* Line Notification Diagnostic & Configuration Modal */}
      <LineNotificationModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        onSuccessToast={showToast}
      />

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0b1120] text-slate-400 text-center py-4 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 dtp-carbooking v2.0 GPS Live • ฝ่ายบริหารยานพาหนะส่วนกลาง</p>
          <p className="text-slate-500 text-[11px]">เชื่อมต่อเซิร์ฟเวอร์เรียลไทม์ GPS พร้อมใช้งาน</p>
        </div>
      </footer>

    </div>
  );
}

export default App;
