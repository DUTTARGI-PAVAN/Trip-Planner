import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function DayMapView({ stops = [], destination = '', dayNumber, theme }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedStopId, setSelectedStopId] = useState(null);

  // Filter stops with valid coordinates
  const validStops = stops.filter(
    (s) =>
      typeof s.latitude === 'number' &&
      typeof s.longitude === 'number' &&
      !isNaN(s.latitude) &&
      !isNaN(s.longitude) &&
      s.latitude !== 0 &&
      s.longitude !== 0
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    }

    // Default center (fallback to destination default or world)
    const initialCenter = validStops.length > 0 ? [validStops[0].latitude, validStops[0].longitude] : [20, 0];
    const initialZoom = validStops.length > 0 ? 13 : 2;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Add high-resolution OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    if (validStops.length > 0) {
      const latLngs = [];
      const markers = [];

      validStops.forEach((stop, idx) => {
        const latLng = [stop.latitude, stop.longitude];
        latLngs.push(latLng);

        // Determine activity category color/icon
        const actType = (stop.activity_type || '').toLowerCase();
        let badgeIcon = '🏛️';
        let badgeClass = 'marker-sightseeing';
        if (actType.includes('food') || actType.includes('meal')) {
          badgeIcon = '🍽️';
          badgeClass = 'marker-food';
        } else if (actType.includes('travel') || actType.includes('transit')) {
          badgeIcon = '🚆';
          badgeClass = 'marker-travel';
        }

        // Custom HTML marker pin
        const customIcon = L.divIcon({
          className: 'custom-map-marker-container',
          html: `
            <div class="custom-map-pin ${badgeClass}" id="marker-${stop.id || idx}">
              <span class="pin-number">${idx + 1}</span>
              <span class="pin-icon">${badgeIcon}</span>
            </div>
          `,
          iconSize: [36, 46],
          iconAnchor: [18, 44],
          popupAnchor: [0, -40],
        });

        const gmapsQuery = encodeURIComponent(`${stop.location}, ${destination}`);
        const popupContent = `
          <div class="map-popup-card">
            <div class="popup-header">
              <span class="popup-step-pill">Stop ${idx + 1}</span>
              <span class="popup-time">${stop.time || ''}</span>
            </div>
            <h4 class="popup-title">${escapeHtml(stop.location)}</h4>
            <p class="popup-desc">${escapeHtml(stop.description || '')}</p>
            <div class="popup-actions">
              <a href="https://www.google.com/maps/search/?api=1&query=${gmapsQuery}" target="_blank" rel="noopener noreferrer" class="popup-gmaps-link">
                📍 Open in Google Maps ↗
              </a>
            </div>
          </div>
        `;

        const marker = L.marker(latLng, { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, { maxWidth: 280, className: 'custom-leaflet-popup' });
        
        marker.on('click', () => {
          setSelectedStopId(stop.id);
        });

        markers.push({ id: stop.id, marker, latLng });
      });

      markersRef.current = markers;

      // Draw polyline connecting stops in order
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      }

      // Fit bounds with padding
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 14);
      } else {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }

    // Force resize calculation after DOM rendering in modal
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [validStops.length, destination]);

  const handleFocusStop = (stop) => {
    setSelectedStopId(stop.id);
    if (!mapInstanceRef.current) return;

    if (stop.latitude && stop.longitude) {
      mapInstanceRef.current.flyTo([stop.latitude, stop.longitude], 15, { duration: 0.8 });
      const found = markersRef.current.find((m) => m.id === stop.id);
      if (found && found.marker) {
        found.marker.openPopup();
      }
    }
  };

  return (
    <div className="day-map-wrapper">
      {validStops.length === 0 ? (
        <div className="map-no-coords-banner">
          <span className="no-coords-icon">🗺️</span>
          <div className="no-coords-content">
            <h4>No Geographic Coordinates Available</h4>
            <p>
              The AI provided stop descriptions for this day without exact decimal coordinates.
              You can search locations directly on external maps.
            </p>
            {stops.length > 0 && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${stops[0]?.location || ''}, ${destination}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-action-small btn-map-external"
              >
                Search "{stops[0]?.location}" on Google Maps ↗
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="day-map-layout">
          {/* Main Map Canvas */}
          <div className="map-canvas-container">
            <div ref={mapContainerRef} className="leaflet-map-element" />
            <div className="map-overlay-badge">
              <span className="badge-pulse" />
              <span>{validStops.length} Route Waypoints mapped</span>
            </div>
          </div>

          {/* Interactive Stop Route Bar */}
          <div className="map-stops-sidebar">
            <h4 className="sidebar-title">Day Route Sequence</h4>
            <div className="sidebar-stops-list">
              {stops.map((stop, idx) => {
                const hasCoords = stop.latitude && stop.longitude;
                const isSelected = selectedStopId === stop.id;
                return (
                  <button
                    key={stop.id || idx}
                    type="button"
                    className={`sidebar-stop-card ${isSelected ? 'active' : ''} ${
                      !hasCoords ? 'disabled' : ''
                    }`}
                    onClick={() => hasCoords && handleFocusStop(stop)}
                    title={hasCoords ? 'Click to focus on map' : 'No coordinates available'}
                  >
                    <div className="stop-card-num">{idx + 1}</div>
                    <div className="stop-card-details">
                      <div className="stop-card-head">
                        <span className="stop-card-time">{stop.time}</span>
                        {hasCoords ? (
                          <span className="stop-card-coords">
                            {stop.latitude.toFixed(2)}, {stop.longitude.toFixed(2)}
                          </span>
                        ) : (
                          <span className="stop-card-unmapped">No coords</span>
                        )}
                      </div>
                      <div className="stop-card-name">{stop.location}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
