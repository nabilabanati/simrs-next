import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";

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
  const noLayoutPrefixes = ["/login", "/register", "/loket-antrian", "/queue", "/counter", "/unauthorized"];
  const doctorRoutes = router.pathname.startsWith("/doctor");
  const nurseRoutes = router.pathname.startsWith("/nurse");
  const cashierRoutes = router.pathname.startsWith("/cashier");

  const shouldUseLayout = !noLayoutPrefixes.some((prefix) => router.pathname.startsWith(prefix)) && !doctorRoutes && !nurseRoutes && !cashierRoutes;

  // Doctor pages without navbar (only sidebar from DoctorLayout)
  if (doctorRoutes) {
    return (
      <>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors />
        <HotToaster />
      </>
    );
  }

  // Nurse pages without navbar (only sidebar from NurseLayout)
  if (nurseRoutes) {
    return (
      <>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors />
        <HotToaster />
      </>
    );
  }

  // Cashier pages without navbar (only sidebar from CashierLayout)
  if (cashierRoutes) {
    return (
      <>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors />
        <HotToaster />
      </>
    );
  }

  // Other pages with sidebar
  if (shouldUseLayout) {
    return (
      <>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Toaster position="top-right" richColors />
        <HotToaster />
      </>
    );
  }

  // Public pages (login, register, queue display)
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors />
      <HotToaster />
    </>
  );
}
