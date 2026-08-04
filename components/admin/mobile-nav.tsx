"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedPathname, setOpenedPathname] = useState(pathname);

  // Closing on navigation keeps the drawer from staying open across pages.
  // Adjusted during render (React's recommended pattern for state that
  // depends on a changing prop) rather than in an effect, so there is no
  // extra post-navigation render where the drawer is still visibly open.
  if (pathname !== openedPathname) {
    setOpenedPathname(pathname);
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="left">
      <DrawerTrigger
        aria-label="Ouvrir le menu"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
      >
        <Menu aria-hidden="true" />
      </DrawerTrigger>
      <DrawerContent className="flex-col border-sidebar-border bg-sidebar text-sidebar-foreground">
        <DrawerTitle className="sr-only">Navigation d&apos;administration</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
