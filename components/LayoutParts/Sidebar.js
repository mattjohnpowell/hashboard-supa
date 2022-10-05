import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export default function Sidebar({ children, sidebarItems }) {
  const router = useRouter();

  return (
    <div className="flex bg-gray-50 flex-col md:flex-row flex-1">
      <aside
        className="h-screen sticky top-16 bg-sky-100 w-full md:w-60 shadow-md "
        aria-label="Sidebar"
      >
        <nav className="overflow-y-auto py-4 px-3 bg-gray-50 rounded dark:bg-gray-800">
          <ul className="space-y-2">
            {sidebarItems.map(({ href, title, icon: Icon }) => (
              <li className="m-2" key={title}>
                <Link href={href}>
                  <a
                                        className={`flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white ${
                        router.asPath === href && "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
            
                    <Icon className="w-6 h-6"/>
                    <span className="ml-3">{title}</span>
                  </a>

                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {children}
    </div>
  );
}
