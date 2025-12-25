"use client";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import React from "react";

const Header = () => {
  const path = usePathname();
  return (
    <div className="flex p-2 items-center justify-between bg-secondary shadow-sm">
      <Image
        src={"/ai-removebg-preview.svg"}
        width={80}
        height={50}
        alt="logo"
      />
      <ul className="hidden md:flex gap-6">
        <li
          className={`hover:text-blue-800 hover:font-bold transition-all cursor-pointer ${
            path == "/dashboard" && "text-blue-800 font-bold"
          }`}
        >
          Dashboard
        </li>
        <li
          className={`hover:text-blue-800 hover:font-bold transition-all cursor-pointer ${
            path == "/dashboard/question" && "text-blue-800 font-bold"
          }`}
        >
          Questioniers
        </li>
        <li
          className={`hover:text-blue-800 hover:font-bold transition-all cursor-pointer ${
            path == "/dashboard/upgrade" && "text-blue-800 font-bold"
          }`}
        >
          Upgrade
        </li>
        <li
          className={`hover:text-blue-800 hover:font-bold transition-all cursor-pointer ${
            path == "/dashboard/howit" && "text-blue-800 font-bold"
          }`}
        >
          How it works
        </li>
      </ul>
      <UserButton />
    </div>
  );
};

export default Header;
