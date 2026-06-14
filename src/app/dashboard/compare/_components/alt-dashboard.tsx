'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Banknote, HandCoins, ShoppingCart, PackageOpen,
  Store, Users, TrendingUp, Trophy, ArrowUpRight,
  Flame, Zap,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import type { DashboardPeriod } from '@/lib/dashboard/types';
import { PERIOD_LABELS } from '@/lib/dashboard/types';

/* ─── Mock data ──────────────────────────────────────────── */

const STATS = {
  revenue: 12_475_000,
  commissions: 1_872_000,
  orders: 1_247,
  inProgress: 45,
  pendingVendors: 12,
  totalUsers: 8_432,
};

const CHART_DATA = [
  { date: '06-01', revenue: 580_000,  orders: 38 },
  { date: '06-02', revenue: 820_000,  orders: 52 },
  { date: '06-03', revenue: 720_000,  orders: 45 },
  { date: '06-04', revenue: 960_000,  orders: 61 },
  { date: '06-05', revenue: 1_100_000,orders: 73 },
  { date: '06-06', revenue: 750_000,  orders: 49 },
  { date: '06-07', revenue: 880_000,  orders: 57 },
  { date: '06-08', revenue: 1_240_000,orders: 78 },
  { date: '06-09', revenue: 1_050_000,orders: 67 },
  { date: '06-10', revenue: 930_000,  orders: 59 },
  { date: '06-11', revenue: 1_380_000,orders: 88 },
  { date: '06-12', revenue: 1_560_000,orders: 94 },
];

const SPARKLINE_REV  = [420, 580, 510, 690, 780, 640, 720, 860, 740, 820, 940, 1100];
const SPARKLINE_COM  = [63,  87,  76, 103, 117,  96, 108, 129, 111, 123, 141, 165];

const TOP_PRODUCTS = [
  { name: 'iPhone 15 Pro Max 256Go', sold: 124, revenue: 7_440_000 },
  { name: 'Tissu Wax Premium 6m', sold: 318, revenue: 1_590_000 },
  { name: 'Samsung Galaxy A55', sold: 89, revenue: 3_115_000 },
  { name: 'Pagne Korhogo 4m', sold: 256, revenue: 768_000 },
  { name: 'Airpods Pro 2ème Gén.', sold: 67, revenue: 2_345_000 },
];

const TOP_VENDORS = [
  { name: 'TechShop Abidjan', orders: 284, revenue: 5_112_000 },
  { name: 'Mode Africaine', orders: 198, revenue: 2_376_000 },
  { name: 'Électronique Plus', orders: 176, revenue: 4_224_000 },
  { name: 'Beauté Naturelle', orders: 142, revenue: 852_000 },
  { name: 'Marché Bio Premium', orders: 118, revenue: 708_000 },
];

/* ─── Helpers ────────────────────────────────────────────── */

const PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'year'];

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace('.', ',') + ' M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' k';
  return String(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

/* ─── Count-up hook ──────────────────────────────────────── */

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4); // ease-out quartic
      setVal(Math.round(target * ease));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return val;
}

/* ─── SVG Sparkline ──────────────────────────────────────── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 160;
  const h = 44;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fill = [...pts, { x: w, y: h }, { x: 0, y: h }]
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const id = `sg-${color.replace(/[^a-z]/gi, '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#${id})`} />
      <polyline
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Glass card ─────────────────────────────────────────── */

function Glass({
  className,
  children,
  glow,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden',
        className,
      )}
      style={glow ? { boxShadow: `0 0 40px ${glow}` } : undefined}
    >
      {children}
    </div>
  );
}

/* ─── Hero KPI ───────────────────────────────────────────── */

function HeroKpi({
  label,
  value,
  suffix,
  sparkline,
  color,
  glow,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  sparkline: number[];
  color: string;
  glow: string;
  icon: React.ElementType;
  delay?: number;
}) {
  const animated = useCountUp(value, 1400 + delay);
  const display = fmtCompact(animated) + (suffix ? ' ' + suffix : '');

  return (
    <Glass
      className="flex-1 p-6 group transition-all duration-300 hover:scale-[1.01]"
      glow={glow}
    >
      {/* Top accent stripe */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</p>
        </div>
        <div
          className="p-2 rounded-xl"
          style={{ background: `${color}20`, boxShadow: `0 0 14px ${color}30` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>

      <p
        className="text-4xl font-black tracking-tight leading-none mb-1"
        style={{
          background: `linear-gradient(135deg, #fff 30%, ${color})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {display}
      </p>
      <p className="text-[11px] text-white/30 mb-5">F CFA cette période</p>

      <Sparkline data={sparkline} color={color} />

      <div className="mt-3 flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3 text-emerald-400" />
        <span className="text-[11px] text-emerald-400 font-semibold">+12,4%</span>
        <span className="text-[11px] text-white/30">vs période préc.</span>
      </div>
    </Glass>
  );
}

/* ─── Stat card ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glow,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  glow: string;
  delay?: number;
}) {
  const animated = useCountUp(value, 1200 + delay);

  return (
    <Glass
      className="p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 cursor-default"
      glow={glow}
    >
      <div
        className="self-start p-2.5 rounded-xl"
        style={{ background: `${color}18`, boxShadow: `0 0 12px ${color}28` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p
          className="text-3xl font-black tracking-tight leading-none"
          style={{
            background: `linear-gradient(135deg, #fff 40%, ${color})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {fmtNum(animated)}
        </p>
        <p className="text-[11px] text-white/35 mt-1.5 font-medium">{label}</p>
      </div>
    </Glass>
  );
}

/* ─── Progress bar list item ─────────────────────────────── */

function RankedItem({
  rank,
  name,
  sub,
  amount,
  max,
  color,
  index,
}: {
  rank: number;
  name: string;
  sub: string;
  amount: number;
  max: number;
  color: string;
  index: number;
}) {
  const pct = Math.round((amount / max) * 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 200 + index * 100);
    return () => clearTimeout(timer);
  }, [pct, index]);

  const MEDAL = ['🥇', '🥈', '🥉'];

  return (
    <div className="group py-2.5 hover:bg-white/5 rounded-xl px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-base leading-none w-5 shrink-0">
          {MEDAL[rank - 1] ?? (
            <span className="text-[11px] font-bold text-white/30 tabular-nums">{rank}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white/90 truncate">{name}</p>
          <p className="text-[11px] text-white/35">{sub}</p>
        </div>
        <span
          className="text-[13px] font-bold shrink-0"
          style={{ color }}
        >
          {fmtCompact(amount)} F
        </span>
      </div>
      <div className="ml-8 h-1 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}90, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export function AltDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const today = format(new Date(), "EEEE d MMMM", { locale: fr });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  const maxProductRevenue = useMemo(() => Math.max(...TOP_PRODUCTS.map((p) => p.revenue)), []);
  const maxVendorRevenue  = useMemo(() => Math.max(...TOP_VENDORS.map((v) => v.revenue)), []);

  return (
    /* Dark canvas — pulls out layout padding */
    <div className="-mx-4 -mb-4 lg:-mx-8 lg:-mb-8 min-h-[calc(100vh-3.5rem)] px-4 py-8 lg:px-8 lg:py-10"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #1a0e3a 0%, #060b18 55%)' }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-5 w-5 text-orange-500" />
            <span
              className="text-2xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #fff 40%, #ff6b00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Vue globale
            </span>
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
              <Zap className="h-2.5 w-2.5" />
              Live
            </span>
          </div>
          <p className="text-[13px] text-white/35">{todayCap}</p>
        </div>

        {/* Period selector — pill style */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200',
                p === period
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-white/40 hover:text-white/70',
              )}
              style={p === period ? { boxShadow: '0 0 14px rgba(255,107,0,0.45)' } : undefined}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero KPIs ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <HeroKpi
          label="Chiffre d'affaires"
          value={STATS.revenue}
          suffix="F"
          sparkline={SPARKLINE_REV}
          color="#ff6b00"
          glow="rgba(255,107,0,0.12)"
          icon={Banknote}
        />
        <HeroKpi
          label="Commissions Asoukaa"
          value={STATS.commissions}
          suffix="F"
          sparkline={SPARKLINE_COM}
          color="#10b981"
          glow="rgba(16,185,129,0.10)"
          icon={HandCoins}
          delay={150}
        />
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Commandes"         value={STATS.orders}         icon={ShoppingCart} color="#3b82f6" glow="rgba(59,130,246,0.08)"  delay={0}   />
        <StatCard label="Commandes en cours" value={STATS.inProgress}     icon={PackageOpen}  color="#f59e0b" glow="rgba(245,158,11,0.08)"  delay={80}  />
        <StatCard label="Vendeurs en attente" value={STATS.pendingVendors} icon={Store}        color="#ec4899" glow="rgba(236,72,153,0.08)" delay={160} />
        <StatCard label="Utilisateurs inscrits" value={STATS.totalUsers}  icon={Users}        color="#8b5cf6" glow="rgba(139,92,246,0.08)" delay={240} />
      </div>

      {/* ── Charts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* Revenue chart */}
        <Glass className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(255,107,0,0.7)]" />
            <p className="text-[13px] font-semibold text-white/80">Chiffre d'affaires</p>
            <span className="ml-auto text-[11px] text-white/30">{PERIOD_LABELS[period]}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="altRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff6b00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tickFormatter={(v: number) => fmtCompact(v)} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { date: string; revenue: number; orders: number };
                  return (
                    <div className="rounded-xl border border-white/10 bg-[#0d1424]/90 backdrop-blur px-3 py-2 text-[12px]">
                      <p className="text-white/40 mb-1">{d.date}</p>
                      <p className="font-bold text-orange-400">{fmtCompact(d.revenue)} F CFA</p>
                      <p className="text-white/40">{d.orders} commandes</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={2} fill="url(#altRevGrad)" dot={false} activeDot={{ r: 4, fill: '#ff6b00', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Glass>

        {/* Orders chart */}
        <Glass className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
            <p className="text-[13px] font-semibold text-white/80">Volume de commandes</p>
            <span className="ml-auto text-[11px] text-white/30">{PERIOD_LABELS[period]}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="altBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { date: string; orders: number };
                  return (
                    <div className="rounded-xl border border-white/10 bg-[#0d1424]/90 backdrop-blur px-3 py-2 text-[12px]">
                      <p className="text-white/40 mb-1">{d.date}</p>
                      <p className="font-bold text-cyan-400">{d.orders} commandes</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="orders" fill="url(#altBarGrad)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Glass>
      </div>

      {/* ── Top 5 ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top produits */}
        <Glass className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="h-4 w-4 text-amber-400" />
            <p className="text-[13px] font-semibold text-white/80">Top 5 produits</p>
            <span className="ml-auto text-[11px] text-white/30">Par revenus</span>
          </div>
          <div className="space-y-1">
            {TOP_PRODUCTS.map((p, i) => (
              <RankedItem
                key={p.name}
                rank={i + 1}
                name={p.name}
                sub={`${fmtNum(p.sold)} vendus`}
                amount={p.revenue}
                max={maxProductRevenue}
                color="#ff6b00"
                index={i}
              />
            ))}
          </div>
        </Glass>

        {/* Top boutiques */}
        <Glass className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <p className="text-[13px] font-semibold text-white/80">Top 5 boutiques</p>
            <span className="ml-auto text-[11px] text-white/30">Par chiffre d'affaires</span>
          </div>
          <div className="space-y-1">
            {TOP_VENDORS.map((v, i) => (
              <RankedItem
                key={v.name}
                rank={i + 1}
                name={v.name}
                sub={`${fmtNum(v.orders)} commandes`}
                amount={v.revenue}
                max={maxVendorRevenue}
                color="#10b981"
                index={i}
              />
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
}
