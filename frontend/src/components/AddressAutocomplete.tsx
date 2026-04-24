"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location...",
  disabled = false,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync value prop to query state if it changes externally
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      // Using Photon API (Komoot) with India bias
      const IndiaBias = "&lat=20.5937&lon=78.9629&bbox=68.1,6.5,97.4,35.5";
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchTerm)}&limit=8${IndiaBias}`
      );
      const data = await res.json();
      
      // Map GeoJSON features to our expected format
      const formattedResults = (data.features || []).map((feature: any) => {
        const p = feature.properties;
        // Build a readable address string
        const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
        // Remove duplicates like if name is same as city
        const uniqueParts = Array.from(new Set(parts));
        
        return {
          display_name: uniqueParts.join(", "),
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0]
        };
      });
      
      setResults(formattedResults);
      setIsOpen(true);
    } catch (err) {
      console.error("Failed to fetch address:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val, null, null); // Clear lat/lng when typing
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      searchAddress(val);
    }, 500);
  };

  const handleSelect = (place: any) => {
    setQuery(place.display_name);
    setIsOpen(false);
    onChange(place.display_name, parseFloat(place.lat), parseFloat(place.lon));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MapPin className="w-5 h-5 text-white/40" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        disabled={disabled}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-lime/50 focus:ring-1 focus:ring-lime/50 transition-all placeholder:text-white/20"
        placeholder={placeholder}
      />
      
      {isLoading && (
        <div className="absolute right-4 top-3.5">
          <div className="w-4 h-4 border-2 border-lime border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-[#1a1e0a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {results.map((place, i) => (
            <li
              key={i}
              onClick={() => handleSelect(place)}
              className="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm text-white/80 transition-colors border-b border-white/5 last:border-0"
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
