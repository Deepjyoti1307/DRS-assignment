"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, X, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      
      const formattedResults = (data.features || []).map((feature: any) => {
        const p = feature.properties;
        const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
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

  const clearInput = () => {
    setQuery("");
    setResults([]);
    onChange("", null, null);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MapPin className="w-5 h-5 text-white/20 group-focus-within:text-lime transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          disabled={disabled}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/40 transition-all placeholder:text-white/20"
          placeholder={placeholder}
        />
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-lime animate-spin" />
          ) : query ? (
            <button
              onClick={clearInput}
              className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] w-full mt-2 bg-[#0d0f04] border border-white/10 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9),0_0_20px_rgba(193,217,73,0.05)] overflow-hidden backdrop-blur-2xl ring-1 ring-white/10"
          >
            <div className="p-3 border-b border-white/5 bg-white/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-lime" />
                <p className="text-[10px] font-black uppercase tracking-widest text-lime">Location Suggestions</p>
              </div>
              <p className="text-[9px] font-medium text-white/20">Powered by Komoot</p>
            </div>
            <ul className="max-h-64 overflow-y-auto custom-scrollbar">
              {results.map((place, i) => (
                <li
                  key={i}
                  onClick={() => handleSelect(place)}
                  className="px-4 py-3.5 hover:bg-lime/10 cursor-pointer group transition-all border-b border-white/5 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-white/20 mt-0.5 group-hover:text-lime transition-colors" />
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors leading-tight">
                      {place.display_name}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-2 bg-white/[0.01] border-t border-white/5 text-center">
              <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-bold">Select a location to lock coordinates</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

