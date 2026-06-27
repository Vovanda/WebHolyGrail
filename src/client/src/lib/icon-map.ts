import type { LucideIcon } from 'lucide-react';
import {
  IdCard,
  FileText,
  Users,
  Puzzle,
  Briefcase,
  Code2,
  MessageCircleQuestion,
  Settings,
  PawPrint,
  Home,
  Square,
  Database,
  Lock,
  ShieldCheck,
  Cloud,
  Box,
  Rocket,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  Star,
  Trophy,
  Target,
  Lightbulb,
  Palette,
  FlaskConical,
  BookOpen,
  Folder,
  Calendar,
  Clock,
  Globe,
  Wrench,
  Key,
} from 'lucide-react';

/**
 * Маппинг emoji → Lucide иконки.
 * Контент-менеджер в Payload вводит привычное emoji (📝/💼/⚙️),
 * на фронте — современный icon pack.
 *
 * Расширяется по мере появления новых emoji в контенте.
 * Если emoji не в маппинге — fallback на сам emoji (graceful degradation).
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  // Project types / категории
  '🪪': IdCard,
  '📝': FileText,
  '👥': Users,
  '🧩': Puzzle,

  // FAQ группы
  '💼': Briefcase,
  '🧑‍💻': Code2,
  '⚙️': Settings,
  '💬': MessageCircleQuestion,

  // Цветные квадраты (project type chips)
  '🟦': Square,
  '🟩': Square,
  '🟨': Square,
  '🟪': Square,
  '🟧': Square,

  // Domain (veo55 наследие, но generic)
  '🐾': PawPrint,
  '🏡': Home,

  // Инфра / безопасность
  '🗄️': Database,
  '🔒': Lock,
  '🔑': Key,
  '🛡️': ShieldCheck,
  '☁️': Cloud,
  '📦': Box,

  // Действия / отметки
  '🚀': Rocket,
  '✨': Sparkles,
  '⚡': Zap,
  '✅': CheckCircle2,
  '❓': HelpCircle,
  '⭐': Star,
  '🏆': Trophy,
  '🎯': Target,
  '💡': Lightbulb,

  // Контент / ресурсы
  '🎨': Palette,
  '🧪': FlaskConical,
  '📚': BookOpen,
  '📁': Folder,
  '📅': Calendar,
  '🕒': Clock,
  '🌐': Globe,
  '🔧': Wrench,
};

/**
 * Цвет «акцента» для chips/тегов с цветными квадратами.
 * Маппится на CSS-токены (не hex).
 */
export const COLOR_EMOJI_TOKEN: Record<string, string> = {
  '🟦': 'text-[var(--color-info,#3b82f6)]',
  '🟩': 'text-[var(--color-success,#16a34a)]',
  '🟨': 'text-[var(--color-warning,#eab308)]',
  '🟪': 'text-[var(--color-accent)]',
  '🟧': 'text-[var(--color-warning,#f97316)]',
};
