import React from 'react';
import { LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavigationItem {
  name: string;
  icon: LucideIcon;
  id: string;
}

interface SidebarProps {
  navigation: NavigationItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}

export default function Sidebar({ navigation, activeTab, onTabChange, onSignOut }: SidebarProps) {
  return (
    <div className="flex flex-col w-64 bg-white border-r">
      <div className="flex-1 flex flex-col pt-5 pb-4">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-semibold text-gray-800">Inventory System</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`${
                activeTab === item.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
            >
              <item.icon
                className={`${
                  activeTab === item.id ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 h-5 w-5`}
              />
              {item.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t p-4">
        <button
          onClick={onSignOut}
          className="flex-shrink-0 w-full group block text-red-600 hover:text-red-700"
        >
          <div className="flex items-center">
            <LogOut className="inline-block h-5 w-5 mr-3" />
            <span className="text-sm font-medium">Sign out</span>
          </div>
        </button>
      </div>
    </div>
  );
}