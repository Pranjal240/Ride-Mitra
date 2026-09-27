"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "@/components/common/Logo";
import { buttonVariants } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#safety", label: "Safety" },
  { href: "#compare", label: "Why Ride Mitra" },
  { href: "#get-app", label: "Get the app" },
];

export function LandingHeader() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-lg"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            Ride<span className="text-accent">Mitra</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/portal")}
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "hidden sm:inline-flex")}
          >
            Sign in <ArrowRight className="size-3.5" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full border border-border text-foreground md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  {n.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/portal");
                }}
                className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-2 w-full")}
              >
                <Smartphone className="size-4" /> Sign in
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default LandingHeader;
