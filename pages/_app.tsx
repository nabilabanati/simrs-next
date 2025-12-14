import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";
import DoctorNavbar from "@/components/layout/DoctorNavbar";
import { useEffect, useState } from "react";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <h2 className="text-lg font-bold">SIMRS</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/loket-pendaftaran">Loket Pendaftaran</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/pasien">Pasien</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/appointments">Jadwal Appointments</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/staff">Staff</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/login">Logout</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <SidebarTrigger />
          </div>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
  }, [router.pathname]);

  // Route prefixes that should not use the layout (e.g. public display and queue pages)
  const noLayoutPrefixes = ["/login", "/register", "/loket-antrian"];
  const doctorRoutes = router.pathname.startsWith("/doctor");

  const shouldUseLayout = !noLayoutPrefixes.some((prefix) => router.pathname.startsWith(prefix)) && !doctorRoutes;

  // Doctor pages with navbar
  if (doctorRoutes) {
    return (
      <>
        <DoctorNavbar userName={user?.nama} />
        <Component {...pageProps} />
      </>
    );
  }

  // Other pages with sidebar
  if (shouldUseLayout) {
    return (
      <Layout>
        <Component {...pageProps} />
      </Layout>
    );
  }

  // Public pages (login, register, queue display)
  return <Component {...pageProps} />;
}
