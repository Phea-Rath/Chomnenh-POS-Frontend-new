import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "600px",
  height: "450px",
};

const defaultCenter = {
  lat: 11.5701,
  lng: 104.8631,
};

const Location = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAJcj9Ngr6EctSkoLOgSzDJyQT_uHemvsQ", // Replace with your API key
    libraries: ["places"],
  });

  // Function to reverse geocode coordinates to an address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAJcj9Ngr6EctSkoLOgSzDJyQT_uHemvsQ` // Replace with your API key
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Address not found");
      }
    } catch (err) {
      setAddress("Error fetching address");
    }
  };

  // Trigger reverse geocoding when location changes
  useEffect(() => {
    if (location) {
      reverseGeocode(location.lat, location.lng);
    }
  }, [location]);

  // Function to fetch location using IP-API
  const getLocation = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://ip-api.com/json/");
      const data = await response.json();

      if (data.status === "success") {
        setLocation({
          lat: data.lat,
          lng: data.lon,
        });
      } else {
        setError("Unable to fetch location from IP-API.");
      }
    } catch (err) {
      setError("Error fetching location: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e) => {
    setLocation({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocation((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Get or Select Your Location
      </h1>

      <button
        onClick={getLocation}
        disabled={loading}
        className={`px-4 py-2 rounded-md text-white font-semibold ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        } transition-colors`}
      >
        {loading ? "Fetching Location..." : "Get My Location"}
      </button>

      {location && (
        <div className="mt-4 space-y-2 text-gray-700">
          <div>
            <label className="block font-medium">Latitude:</label>
            <input
              type="number"
              step="any"
              name="lat"
              value={location.lat}
              onChange={handleInputChange}
              className="border px-3 py-2 w-full rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium">Longitude:</label>
            <input
              type="number"
              step="any"
              name="lng"
              value={location.lng}
              onChange={handleInputChange}
              className="border px-3 py-2 w-full rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium">Address:</label>
            <input
              type="text"
              value={address}
              readOnly
              className="border px-3 py-2 w-full rounded-md bg-gray-100"
            />
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-red-500">{error}</p>}

      <div className="mt-6">
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={location || defaultCenter}
            zoom={13}
            onClick={handleMapClick}
          >
            {location && (
              <Marker
                position={location}
                draggable={true}
                onDragEnd={(e) =>
                  setLocation({
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                  })
                }
              />
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
};

export default Location;
