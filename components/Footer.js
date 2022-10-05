import React from "react";

import Image  from 'next/image';

export default function Footer() {
  return (
    <footer className="flex z-50 justify-center items-center h-16 bg-sky-200">
      <a
        className="flex items-center"
        href="https://hashboard.app"
        target="_blank"
        rel="noopener noreferrer"
      >
        Powered by {" "}
        <Image src="/favicon-32x32.png" width={32} height={32} alt="Hashboard Logo" className="h-4 ml-2" />
      </a>
    </footer>
    
  );
}
