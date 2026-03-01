/**
 * AppSidebar — Story 15.3 (TD-035-C)
 *
 * Persistent collapsible sidebar using shadcn/ui Sidebar primitives.
 * Replaces Navbar.tsx + MobileNav.tsx. Supports icon-only collapse mode,
 * cookie-based state persistence (DEC-15-04), and mobile Sheet overlay.
 *
 * Navigation groups are computed via `computeSidebarGroups()` (CROSS-001)
 * and mapped from the centralized `config/navigation.ts`.
 *
 * @see ADR-016 DEC-016-02 (Sidebar navigation groups)
 * @see REC-15.3-002 (Collapsed tooltip)
 * @see REC-15.3-003 (Active state styling)
 * @see DEC-15-04 (Cookie persistence)
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuthStore, useIsManager } from '@/stores/authStore';
import { computeSidebarGroups } from '@/utils/permissions';
import { navigationItems, groupLabels } from '@/config/navigation';

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const isManager = useIsManager();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const role = user?.role ?? 'EMPLOYEE';
  const visibleGroups = computeSidebarGroups(role, isManager);

  const visibleItems = navigationItems.filter((item) => visibleGroups.includes(item.group));

  // Group items by their group key, preserving order
  const groupedItems = visibleGroups.map((group) => ({
    group,
    label: groupLabels[group],
    items: visibleItems.filter((item) => item.group === group),
  }));

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNavigate = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <Sidebar collapsible="icon" aria-label="Main navigation">
      {/* Brand Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="G-Credit">
              <a href="/" onClick={handleNavigate('/')}>
                <CreditCard className="text-primary" />
                <span className="text-lg font-bold text-primary">G-Credit</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent>
        {groupedItems.map(({ group, label, items }, groupIndex) => (
          <SidebarGroup key={group}>
            {groupIndex > 0 && <SidebarSeparator className="mb-2" />}
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={`${group}-${item.href}`}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <a href={item.href} onClick={handleNavigate(item.href)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: User info + Sign Out */}
      <SidebarFooter>
        <SidebarMenu>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={`${user.firstName} ${user.lastName}`}>
                <a href="/profile" onClick={handleNavigate('/profile')}>
                  <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    {user.firstName.charAt(0)}
                  </div>
                  <span className="truncate">
                    {user.firstName} {user.lastName}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={handleLogout}>
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail — hover strip for toggling collapsed sidebar */}
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
