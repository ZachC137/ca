import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dice1, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@shared/schema";

export default function Header() {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { href: "/", label: "Dashboard", active: location === "/" },
    { href: "/leaderboard", label: "Leaderboard", active: location === "/leaderboard" },
  ];

  return (
    <header className="glass-effect border-b border-[hsl(220,91%,57%)]/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer" data-testid="link-home">
              <div className="w-10 h-10 bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] rounded-lg flex items-center justify-center">
                <Dice1 className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-bold neon-text">CryptoGaming</h1>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`cursor-pointer transition-colors duration-300 ${
                    item.active
                      ? "text-[hsl(220,91%,57%)]"
                      : "hover:text-[hsl(220,91%,57%)]"
                  }`}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {/* Balance */}
            <div className="glass-effect px-4 py-2 rounded-lg" data-testid="display-balance">
              <span className="text-[hsl(43,96%,56%)] font-semibold">
                ${userData?.balance || "0.00"}
              </span>
            </div>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer" data-testid="button-user-menu">
                  <img
                    src={userData?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150"}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-[hsl(220,91%,57%)]"
                  />
                  <ChevronDown className="text-[hsl(215,13%,45%)] hover:text-white transition-colors duration-300 h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-effect border-[hsl(220,91%,57%)]/20">
                <DropdownMenuItem className="text-white hover:bg-[hsl(220,91%,57%)]/20">
                  <span data-testid="text-username">
                    {userData?.firstName || userData?.email || "Player"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-[hsl(220,91%,57%)]/20 cursor-pointer"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
