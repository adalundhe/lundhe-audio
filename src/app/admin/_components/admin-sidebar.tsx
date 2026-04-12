"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Percent,
  Store,
  Ticket,
  Wrench,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const topLevelLinks: NavLink[] = [
  { href: "/admin/coupons", label: "Generate Coupon", icon: Ticket },
  { href: "/admin/gear", label: "Manage Gear", icon: Wrench },
];

const storeLinks: NavLink[] = [
  { href: "/admin/store/products", label: "Products", icon: Package },
  { href: "/admin/store/discounts", label: "Discounts", icon: Percent },
];

const linkClassName =
  "flex w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted";
const desktopSidebarStorageKey = "admin-sidebar-desktop-open";

const AdminSidebarNav = ({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) => {
  const isOnStore = pathname.startsWith("/admin/store");
  const [expandedItem, setExpandedItem] = React.useState<string | undefined>(
    isOnStore ? "store" : undefined,
  );

  React.useEffect(() => {
    if (isOnStore) {
      setExpandedItem("store");
    }
  }, [isOnStore]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex h-full flex-col gap-1" aria-label="Admin navigation">
      <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Admin
      </div>
      {topLevelLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              linkClassName,
              isActive(link.href)
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Icon className="!h-[16px] !w-[16px]" />
            {link.label}
          </Link>
        );
      })}
      <Accordion
        type="single"
        collapsible
        value={expandedItem}
        onValueChange={(value) => setExpandedItem(value || undefined)}
        className="px-0"
      >
        <AccordionItem value="store" className="border-none">
          <AccordionTrigger
            chevronSide="left"
            className={cn(
              "w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted hover:no-underline",
              isOnStore
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Store className="!h-[16px] !w-[16px]" />
            <span className="flex-1 text-left">Manage Store</span>
          </AccordionTrigger>
          <AccordionContent className="w-full pb-1 pt-1">
            <div className="ml-4 flex w-full flex-col gap-1 border-l pl-2">
              {storeLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      linkClassName,
                      isActive(link.href)
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="!h-[16px] !w-[16px]" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </nav>
  );
};

export const AdminSidebar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(true);
  const [desktopStateReady, setDesktopStateReady] = React.useState(false);
  const adminNavTop = "calc(7rem + 1px)";
  const desktopDrawerWidth = "18rem";

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useLayoutEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(desktopSidebarStorageKey);
      if (storedValue === "true" || storedValue === "false") {
        setDesktopOpen(storedValue === "true");
      }
    } catch {
      // Ignore storage read failures and fall back to the default state.
    } finally {
      setDesktopStateReady(true);
    }
  }, []);

  React.useEffect(() => {
    if (!desktopStateReady) return;

    try {
      window.localStorage.setItem(
        desktopSidebarStorageKey,
        desktopOpen ? "true" : "false",
      );
    } catch {
      // Ignore storage write failures and keep the in-memory state.
    }
  }, [desktopOpen, desktopStateReady]);

  return (
    <>
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          {!mobileOpen ? (
            <div className="pb-4">
              <Button
                type="button"
                aria-label="Open admin navigation"
                aria-expanded={false}
                onClick={() => setMobileOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 p-0 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
              >
                <ChevronRight className="!h-[16px] !w-[16px]" />
              </Button>
            </div>
          ) : null}
          <SheetContent
            side="left"
            className="!left-0 !right-0 !top-[calc(7rem+1px)] !bottom-0 !h-auto !w-auto !max-w-none overflow-hidden rounded-none border-r-0 bg-background/95 px-3 pb-4 pt-12 shadow-2xl supports-[backdrop-filter]:bg-background/80 [&>button.absolute:first-child]:hidden"
            style={{ top: adminNavTop }}
          >
            <Button
              type="button"
              aria-label="Collapse admin navigation"
              aria-expanded
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 p-0 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
            >
              <ChevronLeft className="!h-[16px] !w-[16px]" />
            </Button>
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="h-full overflow-y-auto pr-1">
              <AdminSidebarNav
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div
        className={cn(
          "absolute inset-y-0 left-0 z-40 hidden md:block",
          !desktopStateReady && "invisible",
        )}
      >
        <aside
          className={cn(
            "absolute inset-y-0 left-0 z-40 w-72 overflow-hidden border-r bg-background/95 px-3 py-4 shadow-2xl backdrop-blur transition-transform duration-500 ease-in-out supports-[backdrop-filter]:bg-background/80",
            desktopOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="h-full overflow-y-auto pr-1">
            <AdminSidebarNav pathname={pathname} />
          </div>
        </aside>

        <Button
          type="button"
          aria-label={
            desktopOpen ? "Collapse admin navigation" : "Open admin navigation"
          }
          aria-expanded={desktopOpen}
          onClick={() => setDesktopOpen((current) => !current)}
          className={cn(
            "absolute top-4 z-[60] flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 p-0 shadow-lg backdrop-blur transition-[left,transform] duration-500 ease-in-out supports-[backdrop-filter]:bg-background/80",
            desktopOpen ? "-translate-x-1/2" : "translate-x-0",
          )}
          style={{ left: desktopOpen ? desktopDrawerWidth : "1rem" }}
        >
          {desktopOpen ? (
            <ChevronLeft className="!h-[16px] !w-[16px]" />
          ) : (
            <ChevronRight className="!h-[16px] !w-[16px]" />
          )}
        </Button>
      </div>
    </>
  );
};
