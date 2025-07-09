'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

/**
 * Component Sidebar navigation với design DaisyUI bo tròn đẹp
 * @returns JSX Element sidebar với navigation links
 */
export default function Sidebar() {
  const pathname = usePathname();
  
  const menuItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: 'solar:home-2-bold-duotone',
      description: 'Trang chủ và test functions',
      color: 'text-primary'
    },
    {
      title: 'Đồng bộ',
      href: '/sync',
      icon: 'solar:refresh-bold-duotone',
      description: 'Đồng bộ ticket từ HubSpot',
      color: 'text-secondary'
    },
    {
      title: 'Quản lý Tickets',
      href: '/tickets',
      icon: 'solar:ticket-bold-duotone',
      description: 'Xem và quản lý tickets',
      color: 'text-accent'
    },
    {
      title: 'Báo cáo AI',
      href: '/reports',
      icon: 'solar:chart-2-bold-duotone',
      description: 'Tạo báo cáo thông minh',
      color: 'text-info'
    }
  ];
  
  return (
    <aside className="min-h-full w-80 bg-gradient-to-b from-base-100 to-base-200 shadow-2xl border-r border-base-300/50">
      {/* Header với gradient đẹp */}
      <div className="p-6 border-b border-base-200/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Icon icon="solar:ticket-bold-duotone" className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              HubSpot
            </h1>
            <p className="text-sm text-base-content/70 font-medium">Ticket Management</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu với hiệu ứng đẹp */}
      <nav className="p-6">
        <ul className="menu menu-lg w-full space-y-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`
                    flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-content shadow-xl scale-105' 
                      : 'hover:bg-base-200/70 text-base-content hover:shadow-lg hover:scale-102'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isActive 
                      ? 'bg-primary-content/20' 
                      : 'bg-base-200 group-hover:bg-base-300'
                    }
                  `}>
                    <Icon 
                      icon={item.icon} 
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive ? 'text-primary-content' : item.color
                      }`} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold transition-all duration-300 ${
                      isActive ? 'text-primary-content' : 'text-base-content'
                    }`}>
                      {item.title}
                    </div>
                    <div className={`text-sm transition-all duration-300 ${
                      isActive ? 'text-primary-content/80' : 'text-base-content/60'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary-content rounded-full animate-pulse"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile Section */}
      <div className="absolute bottom-20 left-0 right-0 p-6">
        <div className="card bg-gradient-to-r from-base-200 to-base-300 shadow-lg rounded-2xl">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white font-bold">U</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-base-content">User Admin</div>
                <div className="text-xs text-base-content/60">admin@hubspot.com</div>
              </div>
              <div className="dropdown dropdown-top dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                  <Icon icon="solar:menu-dots-bold" className="w-4 h-4" />
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-2xl w-52">
                  <li><a className="rounded-xl"><Icon icon="solar:user-bold" className="w-4 h-4" />Profile</a></li>
                  <li><a className="rounded-xl"><Icon icon="solar:settings-bold" className="w-4 h-4" />Settings</a></li>
                  <li><a className="rounded-xl text-error"><Icon icon="solar:logout-bold" className="w-4 h-4" />Logout</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-base-200/50">
        <div className="text-center text-sm text-base-content/60">
          <p className="font-medium">© 2024 HubSpot Tickets</p>
          <p className="text-xs">Powered by AI ✨</p>
        </div>
      </div>
    </aside>
  );
}