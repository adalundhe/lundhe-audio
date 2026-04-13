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

const storeLinks: NavLink[] = [
  { href: "/admin/store/products", label: "Products", icon: Package },
  { href: "/admin/store/discounts", label: "Discounts", icon: Percent },
  { href: "/admin/coupons", label: "Generate Coupon", icon: Ticket },
];

const studioLinks: NavLink[] = [
  { href: "/admin/gear", label: "Manage Gear", icon: Wrench },
];

const linkClassName =
  "flex min-w-0 w-full items-center justify-start gap-2 overflow-hidden rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:bg-muted";
const childLinkClassName =
  "flex min-w-0 w-full items-center justify-start gap-2 overflow-hidden rounded-md border border-transparent bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-accent/35";
const desktopSidebarStorageKey = "admin-sidebar-desktop-open";

const AdminSidebarNav = ({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) => {
  const isOnStore =
    pathname.startsWith("/admin/store") || pathname.startsWith("/admin/coupons");
  const isOnStudio = pathname.startsWith("/admin/gear");
  const [expandedItem, setExpandedItem] = React.useState<string | undefined>(
    isOnStore ? "store" : isOnStudio ? "studio" : undefined,
  );

  React.useEffect(() => {
    if (isOnStore) {
      setExpandedItem("store");
      return;
    }

    if (isOnStudio) {
      setExpandedItem("studio");
    }
  }, [isOnStore, isOnStudio]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex h-full flex-col gap-1" aria-label="Admin navigation">
      <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Admin
      </div>
      <Accordion
        type="single"
        collapsible
        value={expandedItem}
        onValueChange={(value) => setExpandedItem(value || undefined)}
        className="flex flex-col gap-1 px-0"
      >
        <AccordionItem value="studio" className="group/studio border-none">
          <AccordionTrigger
            chevronSide="left"
            className={cn(
              "w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:bg-muted hover:no-underline group-hover/studio:bg-muted",
              isOnStudio
                ? "border-border/70 bg-muted font-medium text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border)/0.35)]"
                : "text-muted-foreground group-hover/studio:border-border/50 group-hover/studio:text-foreground",
            )}
          >
            <Wrench className="!h-[16px] !w-[16px]" />
            <span className="flex-1 text-left">Manage Studio</span>
          </AccordionTrigger>
          <AccordionContent className="w-full pb-1 pt-1">
            <div className="ml-4 flex min-w-0 flex-col gap-1">
              {studioLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      childLinkClassName,
                      isActive(link.href)
                        ? "border-border/70 bg-accent/55 font-medium text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border)/0.3)]"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="!h-[16px] !w-[16px]" />
                    <span className="min-w-0 truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="store" className="group/store border-none">
          <AccordionTrigger
            chevronSide="left"
            className={cn(
              "w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:bg-muted hover:no-underline group-hover/store:bg-muted",
              isOnStore
                ? "border-border/70 bg-muted font-medium text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border)/0.35)]"
                : "text-muted-foreground group-hover/store:border-border/50 group-hover/store:text-foreground",
            )}
          >
            <Store className="!h-[16px] !w-[16px]" />
            <span className="flex-1 text-left">Manage Store</span>
          </AccordionTrigger>
          <AccordionContent className="w-full pb-1 pt-1">
            <div className="ml-4 flex min-w-0 flex-col gap-1">
              {storeLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      childLinkClassName,
                      isActive(link.href)
                        ? "border-border/70 bg-accent/55 font-medium text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border)/0.3)]"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="!h-[16px] !w-[16px]" />
                    <span className="min-w-0 truncate">{link.label}</span>
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
          <div className="pb-4">
            <Button
              type="button"
              aria-label="Open admin navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 p-0 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80",
                mobileOpen && "pointer-events-none invisible",
              )}
            >
              <ChevronRight className="!h-[16px] !w-[16px]" />
            </Button>
          </div>
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
