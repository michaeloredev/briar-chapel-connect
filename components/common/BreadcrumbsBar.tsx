"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, defaultLabelOverrides } from "@/components/common/Breadcrumbs";
import SearchInput from "@/components/ui/SearchInput";

export default function BreadcrumbsBar() {
  const pathname = usePathname();
  const isHome = !pathname || pathname === "/";
  return (
    <div className="flex items-center justify-between gap-4">
      <Breadcrumbs labelOverrides={defaultLabelOverrides} />
      {isHome ? null : <SearchInput />}
    </div>
  );
}


