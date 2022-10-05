import { signOut } from "next-auth/react";
import {
  HeartIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  CogIcon,
  MailIcon,
} from "@heroicons/react/outline";
// @ts-ignore
import { FaRocket, FiMail } from "react-icons/fa";
import { AiOutlineDashboard } from "react-icons/ai";
import { GrTest } from "react-icons/gr"
export const sidebarItems = [
    {
      href: "/",
      title: "Homepage",
      icon: HomeIcon,
    },
    {
      href: "/dashboard",
      title: "Dashboard",
      icon: AiOutlineDashboard,
    },
    {
      href: "/settings",
      title: "Settings",
      icon: CogIcon,
    },
    {
      href: "/contact",
      title: "Contact",
      icon: MailIcon,
    },    {
        href: "/testpage",
        title: "Tests",
        icon: GrTest,
      },
  ];
export const menuItems = [
  {
    label: "Settings",
    icon: CogIcon,
    href: "/cryptoAccounts",
  },
  {
    label: "List a new home",
    icon: PlusIcon,
    href: "/create",
  },
  {
    label: "My homes",
    icon: HomeIcon,
    href: "/homes",
  },
  {
    label: "Favorites",
    icon: HeartIcon,
    href: "/favorites",
  },
  {
    label: "Logout",
    icon: LogoutIcon,
    onClick: signOut,
  },
];

