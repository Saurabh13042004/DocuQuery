"use client";
import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem, ProductItem } from "./components/ui/navbar-menu";
import { cn } from "@/lib/utils";
import { Cover } from "@/components/ui/cover";
import { FeaturesSectionDemo } from "./components/Features";
import { FileUpload } from "@/components/ui/file-upload";
import { Link } from "react-router-dom";

function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50", className)}
    >
      <Menu setActive={setActive}>
        <MenuItem setActive={setActive} active={active} item="Services">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/web-dev">Web Development</HoveredLink>
            <HoveredLink href="/interface-design">Interface Design</HoveredLink>
            <HoveredLink href="/seo">Search Engine Optimization</HoveredLink>
            <HoveredLink href="/branding">Branding</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Products">
          <div className="  text-sm grid grid-cols-2 gap-10 p-4">
            <ProductItem
              title="Algochurn"
              href="https://algochurn.com"
              src="https://assets.aceternity.com/demos/algochurn.webp"
              description="Prepare for tech interviews like never before."
            />
            <ProductItem
              title="Tailwind Master Kit"
              href="https://tailwindmasterkit.com"
              src="https://assets.aceternity.com/demos/tailwindmasterkit.webp"
              description="Production ready Tailwind css components for your next project"
            />
            <ProductItem
              title="Moonbeam"
              href="https://gomoonbeam.com"
              src="https://assets.aceternity.com/demos/Screenshot+2024-02-21+at+11.51.31%E2%80%AFPM.png"
              description="Never write from scratch again. Go from idea to blog in minutes."
            />
            <ProductItem
              title="Rogue"
              href="https://userogue.com"
              src="https://assets.aceternity.com/demos/Screenshot+2024-02-21+at+11.47.07%E2%80%AFPM.png"
              description="Respond to government RFPs, RFIs and RFQs 10x faster using AI"
            />
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Pricing">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/hobby">Hobby</HoveredLink>
            <HoveredLink href="/individual">Individual</HoveredLink>
            <HoveredLink href="/team">Team</HoveredLink>
            <HoveredLink href="/enterprise">Enterprise</HoveredLink>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-neutral-900 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} DocuQuery. All rights reserved.
        </p>
        <p className="text-sm mt-2">
          Built with ❤️ using Python, FastAPI, LangChain, React.js, and AWS S3.
        </p>
      </div>
    </footer>
  );
}

function LandingPage() {
  const handleFileUpload = (files: File[]) => {
    console.log(files);
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      <Navbar className="top-10 z-50" />

      {/* Hero Section */}
      <div className="w-full pt-40 px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-7xl mx-auto text-center relative z-10 py-6 bg-clip-text text-transparent bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400">
          Welcome to <Cover>DocuQuery</Cover>
        </h1>
        <p className="text-lg text-neutral-700 dark:text-neutral-300 mt-4 max-w-2xl mx-auto">
          Upload your PDFs and interact with them using AI-powered tools. Chat, summarize, and edit your documents effortlessly.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition">
            Get Started
          </button>
          <button className="px-6 py-3 bg-transparent border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-700 hover:text-white transition">
            <Link to="/login">Login</Link>
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full pt-20 px-4">
        <FeaturesSectionDemo />
      </div>

      {/* File Upload Section */}
      <div className="w-full max-w-4xl mx-auto mt-16 p-6 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
        {/* <h2 className="text-2xl font-semibold text-center mb-4">Upload Your PDF</h2>
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Drag and drop your PDF files here or click to upload. Once uploaded, you can chat with your document, summarize its content, or make edits via chat.
        </p> */}
        <FileUpload onChange={handleFileUpload} />
        <div className="mt-6 text-center">
          {/* <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Supported Features:
          </p> */}
          {/* <ul className="list-disc list-inside text-sm text-neutral-700 dark:text-neutral-300 mt-2">
            <li>Chat with your PDF to extract specific information.</li>
            <li>Summarize lengthy documents into concise points.</li>
            <li>Edit your PDF content directly through AI-powered chat.</li>
          </ul> */}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;