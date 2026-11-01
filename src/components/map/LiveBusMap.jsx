import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CAMPUS_CONFIG, TILE_SERVER_CONFIG } from '../../utils/constants';
import { isTelemetryStale } from '../../utils/dateFormatter';
import { AlertTriangle, Clock, MapPin, ChevronDown, ChevronUp, Radio } from 'lucide-react';

// Custom Map Controller to smoothly pan to active bus or route bounds
function MapController({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (center) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// Custom Bus Icon Generator
function createBusIcon(isMoving, heading = 0, isSimulated = false, isDelayed = false) {
  const html = isMoving
    ? `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(49, 85, 231, 0.25); animation: pulse-ring 2s infinite;"></div>
        <div style="width: 38px; height: 38px; background: #D7F36B; border: 2px solid #171717; box-shadow: 2px 2px 0px #171717; display: flex; align-items: center; justify-content: center; font-size: 20px; transform: rotate(${heading}deg); transition: transform 0.3s ease;">
          🚌
        </div>
        ${isDelayed ? '<div style="position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: #FF7043; border: 1.5px solid #171717; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: white;">⚠</div>' : ''}
        ${isSimulated ? '<div style="position: absolute; bottom: -8px; font-family: monospace; font-size: 8px; font-weight: bold; background: #FF7043; color: white; padding: 0 3px; border: 1px solid #171717;">DEMO</div>' : ''}
      </div>
    `
    : `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
        <div style="width: 26px; height: 26px; border-radius: 9999px; background: ${isDelayed ? '#FF7043' : '#171717'}; border: 2px solid #171717; box-shadow: 2px 2px 0px #171717; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: monospace;">
          ${isDelayed ? '⚠' : '●'}
        </div>
      </div>
    `;

  return L.divIcon({
    html,
    className: 'custom-bus-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

// Custom Stop Icon Generator
function createStopIcon(sequence, isCampus = false) {
  const html = isCampus
    ? `
      <div style="width: 32px; height: 32px; background: #3155E7; color: white; border: 2px solid #171717; box-shadow: 2px 2px 0px #171717; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; font-size: 14px;">
        🏛️
      </div>
    `
    : `
      <div style="width: 26px; height: 26px; background: #FFFFFF; color: #171717; border: 2px solid #171717; box-shadow: 2px 2px 0px #171717; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: 800; font-size: 11px;">
        ${sequence}
      </div>
    `;

  return L.divIcon({
    html,
    className: 'custom-stop-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function LiveBusMap({
  bus,
  route,
  height = '480px',
  showAllStops = true,
  interactive = true,
}) {
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  const telemetry = bus?.currentLocation;
  const isMoving = (telemetry?.speed || 0) > CAMPUS_CONFIG.STATIONARY_SPEED_KMH;
  const isStale = isTelemetryStale(telemetry?.updatedAt, CAMPUS_CONFIG.STALE_LOCATION_THRESHOLD_SECONDS);
  const isDelayed = (telemetry?.delayMinutes || 0) > CAMPUS_CONFIG.DELAY_ALERT_THRESHOLD_MINUTES;

  // Polyline coordinates from route stops
  const polylineCoords = useMemo(() => {
    if (!route?.stops) return [];
    return route.stops.map(s => [s.lat, s.lon]);
  }, [route]);

  // Center coordinate: bus location or first stop
  const centerCoord = useMemo(() => {
    if (telemetry?.lat && telemetry?.lon) {
      return [telemetry.lat, telemetry.lon];
    }
    if (route?.stops && route.stops.length > 0) {
      return [route.stops[0].lat, route.stops[0].lon];
    }
    return [CAMPUS_CONFIG.LATITUDE, CAMPUS_CONFIG.LONGITUDE];
  }, [telemetry, route]);

  return (
    <div className="relative border-2 border-campus-black shadow-brutal overflow-hidden bg-white">
      {/* Top telemetry overlay bar */}
      <div className="bg-campus-black text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b-2 border-campus-black z-20 relative">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-campus-lime flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-campus-lime" />
            BUS {bus?.busNumber || 1} • {bus?.registrationNumber || 'KA-01-MJ-5421'}
          </span>
          <span className="font-mono text-xs text-white/80">
            SPEED: {telemetry?.speed?.toFixed(1) || '0.0'} KM/H
          </span>
          <span className="font-mono text-xs text-white/80">
            STATUS: <span className="text-campus-lime font-bold">{isMoving ? 'ON THE WAY' : 'STOPPED'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {telemetry?.isSimulated && (
            <span className="px-2 py-0.5 bg-campus-orange text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-white">
              DEMO DATA SIMULATION
            </span>
          )}
          {isStale && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              <Clock className="w-3 h-3" /> LOCATION STALE (&gt; 2 MINS)
            </span>
          )}
          {isDelayed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-campus-black text-[10px] font-mono font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" /> DELAY: +{telemetry?.delayMinutes} MINS
            </span>
          )}
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="px-2 py-0.5 bg-white text-campus-black text-[10px] font-mono font-bold uppercase border border-campus-black hover:bg-neutral-100 flex items-center gap-1"
          >
            <span>INFO PANEL</span>
            {showInfoPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Delay Explanation Banner (if delay > 3 mins) */}
      {isDelayed && (
        <div className="bg-amber-100 border-b-2 border-campus-black px-4 py-2 font-mono text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-800" />
            <span>
              <strong>⚠ BUS DELAY:</strong> Bus {bus?.busNumber} running {telemetry?.delayMinutes || 5} mins late
              {telemetry?.delayReason ? ` (${telemetry.delayReason})` : ''} near {telemetry?.currentStopName || 'transit corridor'}.
            </span>
          </div>
          <span className="text-[10px] text-amber-800">
            Updated: {new Date(telemetry?.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Map Container */}
      <div style={{ height }}>
        <MapContainer
          center={centerCoord}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution={TILE_SERVER_CONFIG.ATTRIBUTION}
            url={TILE_SERVER_CONFIG.URL}
          />

          <MapController center={centerCoord} zoom={13} />

          {/* Road Route Polyline connecting 10 stops */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: route?.color || '#3155E7',
                weight: 5,
                opacity: 0.85,
                dashArray: '8, 8',
              }}
            />
          )}

          {/* Campus Destination Center & 200m Circular Geofence Layer */}
          <Circle
            center={[CAMPUS_CONFIG.LATITUDE, CAMPUS_CONFIG.LONGITUDE]}
            radius={CAMPUS_CONFIG.GEOFENCE_RADIUS_METERS}
            pathOptions={{
              color: '#3155E7',
              fillColor: '#3155E7',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '4, 4',
            }}
          />

          {/* 10 Route Stops (Circle Markers with sequence numbers) */}
          {showAllStops && route?.stops?.map((stop) => {
            const isCampus = stop.sequence === 10;
            return (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lon]}
                icon={createStopIcon(stop.sequence, isCampus)}
              >
                <Popup>
                  <div className="font-sans">
                    <div className="font-heading font-bold text-sm text-campus-black border-b border-campus-black pb-1 mb-1">
                      Stop #{stop.sequence}: {stop.name}
                    </div>
                    <div className="font-mono text-xs text-campus-muted">
                      Scheduled Arrival: <span className="font-bold text-campus-black">{stop.scheduledTime}</span>
                    </div>
                    <div className="font-mono text-[10px] text-campus-muted mt-1">
                      Coordinates: {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Live Bus Marker (Moving bus emoji > 3 km/h vs stationary node) */}
          {telemetry?.lat && telemetry?.lon && (
            <Marker
              position={[telemetry.lat, telemetry.lon]}
              icon={createBusIcon(isMoving, telemetry.heading || 0, telemetry.isSimulated, isDelayed)}
            >
              <Popup>
                <div className="p-1 font-sans">
                  <div className="font-heading font-bold text-sm text-campus-black border-b border-campus-black pb-1 mb-1">
                    🚌 BUS {bus?.busNumber} ({bus?.registrationNumber})
                  </div>
                  <div className="space-y-0.5 font-mono text-xs">
                    <div>Route: <span className="font-bold">{route?.name || `Route ${bus?.assignedRouteNumber}`}</span></div>
                    <div>Driver: <span className="font-bold">{bus?.driver?.name}</span> ({bus?.driver?.phone})</div>
                    <div>Speed: <span className="font-bold">{telemetry.speed?.toFixed(1)} km/h</span></div>
                    <div>Current Location: <span className="font-bold">{telemetry.currentStopName || 'In Transit'}</span></div>
                    <div>Next Stop: <span className="font-bold">{telemetry.nextStopName || 'Approaching Stop'}</span></div>
                    <div>Delay: <span className={`font-bold ${telemetry.delayMinutes > 3 ? 'text-rose-600' : 'text-emerald-700'}`}>+{telemetry.delayMinutes || 0} min</span></div>
                    <div className="text-[10px] text-campus-muted mt-1">
                      Telemetry: 100m Movement Delta Active
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Collapsible Telemetry Information Panel (Per bustracking steps.pdf Page 44-46) */}
      {showInfoPanel && (
        <div className="bg-campus-bg border-t-2 border-campus-black p-4 font-mono text-xs text-campus-black">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-2 bg-white border border-campus-black">
              <span className="text-[10px] text-campus-muted block uppercase font-bold">Assigned Bus</span>
              <span className="font-extrabold text-sm text-campus-black">BUS {bus?.busNumber}</span>
              <span className="text-[10px] text-campus-muted block">{bus?.registrationNumber}</span>
            </div>
            <div className="p-2 bg-white border border-campus-black">
              <span className="text-[10px] text-campus-muted block uppercase font-bold">Active Route</span>
              <span className="font-extrabold text-xs text-campus-blue truncate block">Route {bus?.assignedRouteNumber}</span>
              <span className="text-[10px] text-campus-muted block">10 Stops Total</span>
            </div>
            <div className="p-2 bg-white border border-campus-black">
              <span className="text-[10px] text-campus-muted block uppercase font-bold">Transit Status</span>
              <span className={`font-extrabold text-xs uppercase ${isMoving ? 'text-emerald-700' : 'text-campus-orange'}`}>
                {isDelayed ? 'DELAYED' : isMoving ? 'ON THE WAY' : 'STOPPED'}
              </span>
              <span className="text-[10px] text-campus-muted block">{telemetry?.speed?.toFixed(1) || 0} km/h</span>
            </div>
            <div className="p-2 bg-white border border-campus-black">
              <span className="text-[10px] text-campus-muted block uppercase font-bold">Current Location</span>
              <span className="font-bold text-xs truncate block">{telemetry?.currentStopName || 'Near Route Start'}</span>
              <span className="text-[10px] text-campus-muted block">Stop #{telemetry?.currentStopSequence || 1}</span>
            </div>
            <div className="p-2 bg-white border border-campus-black">
              <span className="text-[10px] text-campus-muted block uppercase font-bold">Next Stop &amp; ETA</span>
              <span className="font-bold text-xs truncate block">{telemetry?.nextStopName || 'College Campus'}</span>
              <span className="text-[10px] text-campus-blue font-bold block">{telemetry?.estimatedArrivalStop || '07:45 AM'}</span>
            </div>
            <div className={`p-2 border border-campus-black ${isDelayed ? 'bg-amber-100' : 'bg-white'}`}>
              <span className="text-[10px] text-campus-muted block uppercase font-bold">Delay Telemetry</span>
              <span className={`font-extrabold text-xs block ${isDelayed ? 'text-amber-900' : 'text-emerald-700'}`}>
                {isDelayed ? `+${telemetry?.delayMinutes} MINS` : 'ON TIME (0m)'}
              </span>
              <span className="text-[10px] text-campus-muted block truncate">
                {telemetry?.delayReason || 'Schedule Normal'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom map metadata legend */}
      <div className="bg-campus-black text-white px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-campus-lime border border-white inline-block"></span>
            Bus Marker (&gt;3 km/h emoji)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-white text-campus-black font-bold text-[8px] flex items-center justify-center border border-white">1</span>
            10 Route Stops
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-campus-blue border border-white inline-block"></span>
            Campus Geofence (200m)
          </span>
        </div>
        <div>
          Last GPS Telemetry Refresh: <span className="font-bold text-campus-lime">~10s interval</span>
        </div>
      </div>
    </div>
  );
}
