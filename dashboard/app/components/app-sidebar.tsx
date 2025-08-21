"use client"

import { Car, Home, Users, Wrench, BarChart3, UserCog } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Panel Principal",
    url: "dashboard",
    icon: Home,
  },
  {
    title: "Vehículos",
    url: "cars",
    icon: Car,
  },
  {
    title: "Trabajos",
    url: "work-orders",
    icon: Wrench,
  },
  {
    title: "Clientes",
    url: "clients",
    icon: Users,
  },
  {
    title: "Mecánicos",
    url: "mechanics",
    icon: UserCog,
  },
  {
    title: "Reportes",
    url: "reports",
    icon: BarChart3,
  },
]

interface AppSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export function AppSidebar({ activeSection, setActiveSection }: AppSidebarProps) {
  return (
    <Sidebar className="border-r bg-white" style={{ background: 'white !important' }}>
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center justify-center">
          <img 
            src="/auto-andrade.png" 
            alt="Auto Andrade Logo" 
            className="w-80 h-auto max-h-24 object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.url)}
                    isActive={activeSection === item.url}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
