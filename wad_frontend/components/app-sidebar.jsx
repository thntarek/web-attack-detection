"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Database,
  Home,
  LayoutDashboardIcon,
  ShieldCheck,
  ShieldOff,
  ShieldPlusIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const data = {
  navMain: [
    {
      title: "Home",
      href: "/",
      icon: <Home />,
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Vuln Web",
      href: "/vulnweb",
      icon: <ShieldOff />,
    },
    {
      title: "Secure Web",
      href: "/secureweb",
      icon: <ShieldCheck />,
    },
    {
      title: "Test Payload",
      href: "/instanttest",
      icon: <Database />,
    },
  ],
};

function NavMain({ items }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeClassName = "border-l-4 border-primary";

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              key={item.title}
              onClick={() => router.push(item.href)}
              className={pathname === item.href ? activeClassName : ""}
            >
              <SidebarMenuButton tooltip={item.title}>
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }) {
  const router = useRouter();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuButton
            tooltip="Logo"
            className="flex items-center justify-center gap-2 min-w-8 text-primary duration-200 ease-linear font-black text-2xl border [&_svg]:!w-6 [&_svg]:!h-6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            onClick={() => router.push("/")}
          >
            <ShieldPlusIcon className="shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              CYSECER
            </span>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}
