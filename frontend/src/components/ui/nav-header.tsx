"use client"; 

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NavHeader() {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative mx-auto flex w-fit rounded-full border border-white/20 bg-white/5 backdrop-blur-md p-1"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      <Tab setPosition={setPosition} href="#explore">Explore</Tab>
      <Tab setPosition={setPosition} href="#features">Features</Tab>
      <Tab setPosition={setPosition} href="#pricing">Pricing</Tab>
      
      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  href
}: {
  children: React.ReactNode;
  setPosition: any;
  href: string;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-10 block cursor-pointer px-4 py-2 text-sm font-medium text-gray-200 hover:text-white md:px-5 md:py-2.5 md:text-sm transition-colors"
    >
      <Link href={href} className="block w-full h-full">
        {children}
      </Link>
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 inset-y-1 rounded-full bg-lime/20 backdrop-blur-md border border-lime/30 shadow-[0_0_15px_rgba(193,217,73,0.2)]"
    />
  );
}
