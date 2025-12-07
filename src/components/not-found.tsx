// app/not-found.tsx
"use client";

import React from "react";
import Image from "next/image";
import landscape from "../public/images/landscape.jpg";

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function NotFound() {
  return (
    <div className="w-screen min-h-screen bg-black flex flex-col">
      <div className="w-full">
        <Image
          src={landscape}
          alt="Landscape"
        //   width={1920}
        //   height={600}
          className="w-full h-auto object-cover"
          priority
          placeholder="blur"
        />
      </div>
      <div className="flex-grow flex flex-col items-center justify-center px-8 text-[#FAF9EE] font-[anziano]">
        <h1 className="text-6xl md:text-7xl text-center mb-2">
          You've reached the backwoods.
        </h1>
        <p className="text-center text-2xl mb-2">
          This page is still under construction.
        </p>
        <a
          className="flex items-center transition-all hover:text-stone-500 text-xl"
          href="/"
        >
          <ArrowIcon />
          <p className="ml-2 h-7">Back</p>
        </a>
      </div>
    </div>
  );
}