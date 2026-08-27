import {
  LayoutDashboard,
  ShoppingBag,
  Coins,
  Wallet,
  CreditCard,
  Globe,
  Tag,
  Clock,
  MessageSquare,
  MessageCircle,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Timeline", href: "/timeline", icon: Clock },
  { title: "Purchases", href: "/purchases", icon: ShoppingBag },
  { title: "Holdings", href: "/holdings", icon: Wallet },
  { title: "Rewards", href: "/cashback", icon: Coins },
  { title: "Cards", href: "/analytics/cards", icon: CreditCard },
  { title: "Websites", href: "/analytics/websites", icon: Globe },
  { title: "Brands", href: "/analytics/brands", icon: Tag },
  { title: "Talk to admin", href: "/messages", icon: MessageCircle },
  { title: "Feedback", href: "/feedback", icon: MessageSquare },
  { title: "Profile & Settings", href: "/settings", icon: Settings },
]
