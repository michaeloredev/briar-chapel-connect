"use client";
import React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Breadcrumbs, defaultLabelOverrides } from "@/components/common/Breadcrumbs";
import SearchInput from "@/components/ui/SearchInput";
import { marketplaceListHref } from "@/lib/data/marketplace-categories";

export default function BreadcrumbsBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHome = !pathname || pathname === "/";
  const isServices = pathname?.startsWith("/services");
  const isMarketplace = pathname?.startsWith("/marketplace");

  const q = searchParams?.get('q') ?? '';
  const category = searchParams?.get('category') ?? '';
  const condition = (searchParams?.get('condition') as any) ?? '';
  const min = searchParams?.get('min') ?? '';
  const max = searchParams?.get('max') ?? '';
  return (
    <div className="flex items-center justify-between gap-4">
      <Breadcrumbs labelOverrides={defaultLabelOverrides} />
      {isServices ? <SearchInput /> : null}
      {isMarketplace ? (
        <SearchInput
          initialValue={q}
          placeholder="Search items…"
          ariaLabel="Search marketplace items"
          onSubmit={(value) => {
            router.push(
              marketplaceListHref({
                q: value,
                category,
                condition,
                min,
                max,
              }),
            );
          }}
          onClear={() => {
            router.push(
              marketplaceListHref({
                category,
                condition,
                min,
                max,
              }),
            );
          }}
        />
      ) : null}
    </div>
  );
}


