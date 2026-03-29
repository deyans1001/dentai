"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Защо DentAI", href: "#pain-points" },
  { label: "Как работи", href: "#how-it-works" },
  { label: "Демо", href: "#demo" },
  { label: "Цени", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function scrollTo(href: string) {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-dark-900/95 backdrop-blur-md border-b border-white/8 shadow-xl shadow-black/20"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">
                🦷
              </div>
              <span className="text-xl font-heading font-bold text-white">
                Dent<span className="text-brand-blue">AI</span>
              </span>
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="/login"
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                Вход
              </a>
              <a
                href="/register"
                className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                Безплатен старт
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-dark-900/98 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300",
          menuOpen ? "opacity-100 pointer-events-all" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-2xl font-heading font-semibold text-white hover:text-brand-blue transition-colors"
            >
              {link.label}
            </button>
          ))}
          <div className="flex flex-col items-center gap-4 mt-4">
            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-slate-400 text-lg"
            >
              Вход
            </a>
            <a
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="px-8 py-3 rounded-xl bg-brand-blue text-white font-semibold text-lg"
            >
              Безплатен старт
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
