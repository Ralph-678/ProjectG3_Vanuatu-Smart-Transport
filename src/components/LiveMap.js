import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LiveMap.css';

// Fix for default Leaflet marker icon issue in Webpack/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom() || 15);
    }
  }, [center, map]);
  return null;
};

const LiveMap = ({ location, destinationText }) => {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return (
      <div className="live-map-unavailable">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <p>Location connecting...</p>
      </div>
    );
  }

  const position = [location.lat, location.lng];

  return (
    <div className="live-map-wrapper">
      <div className="live-map-header">LIVE TRACKING</div>
      <div className="live-map-container">
        <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={location} />
          <Marker position={position}>
            <Popup>
              {destinationText || "Driver Location"}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveMap;
