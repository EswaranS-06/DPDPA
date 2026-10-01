import {
  BookOpen,
  Building,
  ClipboardList,
  FileCheck,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Network,
  ShieldCheck,
  TriangleAlert,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { NavIcon } from './navigation'

/** One icon per section, from one family (Lucide, 1.75 px stroke). */
export const NAV_ICON: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  clients: Building,
  kb: BookOpen,
  staff: UserCog,
  bands: Gauge,
  clientHome: ShieldCheck,
  assessments: ClipboardList,
  evidence: FileCheck,
  findings: ListChecks,
  risks: TriangleAlert,
  actions: Wrench,
  reports: FileText,
  departments: Network,
  people: Users,
}
