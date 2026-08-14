import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Car, 
  Phone, 
  MapPin, 
  Gauge, 
  BatteryCharging, 
  Compass, 
  Navigation,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Vehicle, Driver, BookingRequest } from '../types';
import { getVehicleLiveStatus } from '../utils/bookingUtils';
import L from 'leaflet';

interface RealtimeTrackingTabProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings?: BookingRequest[];
}

export const RealtimeTrackingTab: React.FC<RealtimeTrackingTabProps> = ({
  vehicles,
  drivers,
  bookings = [],
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [activeVehicles, setActiveVehicles] = useState<Vehicle[]>(vehicles);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const selectedVehicle = activeVehicles.find((v) => v.id === selectedVehicleId) || activeVehicles[0];
  const assignedDriver = drivers.find((d) => d.id === selectedVehicle?.assignedDriverId) || drivers[0];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.7800, 100.5800],
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    return () => {
      // Map cleanup if component unmounts
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    activeVehicles.forEach((veh) => {
      const isSelected = veh.id === selectedVehicle?.id;
      const customIcon = L.divIcon({
        className: 'custom-car-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: ${isSelected ? '#2563eb' : veh.status === 'available' ? '#10b981' : '#f59e0b'};
              color: white;
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              ${veh.plateNumber.split(' ')[0]} (${veh.speedKmH} km/h)
            </div>
            <div style="
              width: 14px;
              height: 14px;
              background: ${isSelected ? '#1d4ed8' : '#334155'};
              transform: rotate(45deg);
              margin-top: -6px;
              border-bottom: 2px solid white;
              border-right: 2px solid white;
            "></div>
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 36],
      });

      if (markersRef.current[veh.id]) {
        markersRef.current[veh.id].setLatLng([veh.lat, veh.lng]);
        markersRef.current[veh.id].setIcon(customIcon);
      } else {
        const marker = L.marker([veh.lat, veh.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedVehicleId(veh.id);
        });
        markersRef.current[veh.id] = marker;
      }
    });
  }, [activeVehicles, selectedVehicle?.id]);

  // Pan to selected vehicle
  useEffect(() => {
    if (leafletMapRef.current && selectedVehicle) {
      leafletMapRef.current.panTo([selectedVehicle.lat, selectedVehicle.lng], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedVehicleId]);

  // Simulated GPS Movement Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveVehicles((prevList) =>
        prevList.map((v) => {
          if (v.status === 'maintenance') return v;
          const deltaLat = (Math.random() - 0.49) * 0.0012;
          const deltaLng = (Math.random() - 0.49) * 0.0012;
          const deltaSpeed = Math.min(110, Math.max(0, v.speedKmH + Math.floor((Math.random() - 0.5) * 6)));
          return {
            ...v,
            lat: v.lat + deltaLat,
            lng: v.lng + deltaLng,
            speedKmH: v.speedKmH === 0 ? 0 : deltaSpeed,
          };
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-3 sm:px-4 space-y-5">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-['Prompt'] text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
            ระบบติดตามตำแหน่งยานพาหนะแบบเรียลไทม์ (Live Fleet GPS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            อัปเดตพิกัด GPS ความเร็ว อัตราสิ้นเปลือง และสถานะสารถีทุกๆ 3 วินาที
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            เชื่อมต่อดาวเทียม GPS 8/8 ดวง
          </span>
        </div>
      </div>

      {/* Map & Telemetry Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Live Leaflet Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative min-h-[460px] lg:min-h-[560px] flex flex-col">
          <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

          {/* Map Top Floating Overlay Info */}
          {selectedVehicle && (
            <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 bg-slate-950/90 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-3">
              <img
                src={selectedVehicle.image}
                alt={selectedVehicle.name}
                className="w-12 h-9 object-cover rounded-lg border border-slate-700"
              />
              <div>
                <h4 className="text-xs font-bold text-white">{selectedVehicle.name}</h4>
                <p className="text-[11px] text-slate-400">
                  พิกัด: {selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)} | ความเร็ว: <span className="text-emerald-400 font-bold">{selectedVehicle.speedKmH} กม./ชม.</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Vehicle Selector & Detail Panel */}
        <div className="space-y-4">
          
          {/* Selected Vehicle Card */}
          {selectedVehicle && (() => {
            const selectedLive = getVehicleLiveStatus(selectedVehicle, bookings);
            return (
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    ยานพาหนะที่เลือก
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${selectedLive.badgeClass}`}>
                    {selectedLive.statusLabel}
                  </span>
                </div>

                {/* Vehicle Title & Image */}
                <div className="flex items-center gap-3">
                  <img
                    src={selectedVehicle.image}
                    alt={selectedVehicle.name}
                    className="w-20 h-14 object-cover rounded-xl border border-slate-200"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedVehicle.name}</h3>
                    <p className="text-xs text-slate-500">{selectedVehicle.plateNumber}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{selectedVehicle.fuelType}</p>
                  </div>
                </div>

                {selectedLive.detail && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                    <span className="text-base">⏰</span>
                    <span>{selectedLive.detail}</span>
                  </div>
                )}

              {/* Realtime Metrics 3 Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">ความเร็ว</span>
                  <strong className="text-sm font-black text-slate-800">{selectedVehicle.speedKmH}</strong>
                  <span className="text-[9px] text-slate-400 block">กม./ชม.</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">เชื้อเพลิง/แบต</span>
                  <strong className="text-sm font-black text-emerald-600">{selectedVehicle.batteryOrFuel}%</strong>
                  <span className="text-[9px] text-slate-400 block">ความจุ</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">เลขไมล์สะสม</span>
                  <strong className="text-sm font-black text-blue-600">{selectedVehicle.mileageKm.toLocaleString()}</strong>
                  <span className="text-[9px] text-slate-400 block">กม.</span>
                </div>
              </div>

              {/* Driver assigned card */}
              {assignedDriver && (
                <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={assignedDriver.photo}
                      alt={assignedDriver.name}
                      className="w-10 h-10 rounded-full object-cover border border-blue-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{assignedDriver.name}</p>
                      <p className="text-[11px] text-slate-600">{assignedDriver.phone}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${assignedDriver.phone}`}
                    className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                    title="โทรหาสารถี"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          );
        })()}

          {/* Vehicle List */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              ยานพาหนะทั้งหมดในระบบ ({activeVehicles.length} คัน)
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeVehicles.map((v) => {
                const isSelected = v.id === selectedVehicle?.id;
                const vLive = getVehicleLiveStatus(v, bookings);

                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        vLive.status === 'available'
                          ? 'bg-emerald-500'
                          : vLive.status === 'in_use'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-rose-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{v.name.split(' ')[0]} {v.plateNumber.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-500">{v.typeNameTh} • {vLive.statusLabel}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-blue-700 shrink-0">
                      {v.speedKmH} km/h
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
