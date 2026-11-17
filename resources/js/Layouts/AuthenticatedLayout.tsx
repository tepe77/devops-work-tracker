import { PropsWithChildren, ReactNode, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    LayoutDashboard,
    CheckSquare,
    Server,
    FileBarChart,
    Users,
    Shield,
    FolderKanban,
    Tag,
    Menu,
    X,
    LogOut,
    ChevronDown,
    UserCircle,
    CheckCircle2,
    AlertCircle,
    Radio,
    Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: route().current('dashboard') },
        { name: 'Executive Board', href: route('executive.board'), icon: Eye, active: route().current('executive.*') },
        { name: 'Tasks & Pekerjaan', href: route('tasks.index'), icon: CheckSquare, active: route().current('tasks.*') },
        { name: 'Infrastruktur Assets', href: route('infrastructure.index'), icon: Server, active: route().current('infrastructure.*') },
        { name: 'Laporan & Analytics', href: route('reports.index'), icon: FileBarChart, active: route().current('reports.*') },
        { name: 'Audit Logs', href: route('audit-logs.index'), icon: Shield, active: route().current('audit-logs.*') },
    ];

    const adminItems = [
        { name: 'Kelola Pengguna', href: route('users.index'), icon: Users, active: route().current('users.*') },
        { name: 'Kategori Pekerjaan', href: route('categories.index'), icon: Tag, active: route().current('categories.*') },
        { name: 'Projects', href: route('projects.index'), icon: FolderKanban, active: route().current('projects.*') },
    ];

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } flex flex-col justify-between`}
            >
                <div>
                    {/* Brand header */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                        <Link href={route('dashboard')} className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center p-1 border border-blue-500/20 shadow-xs shrink-0">
                                <ApplicationLogo className="w-7 h-7 object-contain" />
                            </div>
                            <div>
                                <span className="font-bold text-base tracking-tight text-foreground block leading-tight">
                                    DevOps Tracker
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    Work & Infra Monitor
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-md text-muted-foreground hover:bg-muted"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="p-4 space-y-6">
                        <div>
                            <div className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Menu Utama
                            </div>
                            <nav className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                item.active
                                                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {user?.is_admin && (
                            <div>
                                <div className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Administrasi
                                </div>
                                <nav className="space-y-1">
                                    {adminItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                    item.active
                                                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 shrink-0" />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar footer user badge */}
                <div className="p-4 border-t border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 truncate">
                                <div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                            </div>
                        </div>
                        <Badge variant={user?.is_admin ? 'default' : 'secondary'} className="text-[10px] shrink-0 ml-1">
                            {user?.is_admin ? 'Admin' : 'Viewer'}
                        </Badge>
                    </div>
                </div>
            </aside>

            {/* Main content wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top header navbar */}
                <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-3.5 sm:px-8 sticky top-0 z-30">
                    <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-muted"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        {header ? (
                            <div className="truncate text-xs sm:text-sm">{header}</div>
                        ) : (
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground truncate">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="font-medium text-foreground truncate">DevOps Live Console</span>
                                <span className="hidden sm:inline">&bull;</span>
                                <span className="hidden sm:inline">Timezone: Asia/Jakarta</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="space-x-1.5 sm:space-x-2 bg-card h-8 px-2 sm:px-3">
                                    <UserCircle className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-xs font-semibold max-w-[80px] sm:max-w-[130px] truncate">{user?.name}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="font-semibold text-xs">{user?.name}</div>
                                    <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                                    <Badge variant={user?.is_admin ? 'default' : 'secondary'} className="text-[9px] mt-1">
                                        {user?.is_admin ? 'DevOps Engineer (Admin)' : 'Management (Viewer)'}
                                    </Badge>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('profile.edit')} className="cursor-pointer">
                                        Profil Pengguna
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="w-full text-destructive flex items-center space-x-2 cursor-pointer font-medium"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Keluar (Logout)</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page body with spacious wide container */}
                <main className="flex-1 w-full max-w-[1700px] mx-auto px-3.5 sm:px-8 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    {/* Flash messages */}
                    {flash?.success && (
                        <Alert variant="success" className="animate-in fade-in duration-200 shadow-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{flash.success}</AlertDescription>
                        </Alert>
                    )}

                    {flash?.error && (
                        <Alert variant="destructive" className="animate-in fade-in duration-200 shadow-xs">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{flash.error}</AlertDescription>
                        </Alert>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
