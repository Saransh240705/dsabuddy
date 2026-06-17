/**
 * @component StatCard
 * @description Reusable card for displaying statistics with icon
 * Used for quick stats display across the dashboard
 */
export function StatCard({ icon: Icon, label, value, change, color = '#35b9f1' }) {
  return (
    <div className="bg-[#161B22] rounded-xl p-6 border border-[#1F2937] hover:border-[#35b9f1]/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-[#0D1117]">
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {change && (
          <span className={`text-xs font-JetBrains-Mono ${change > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-[#6B7280] text-xs mb-1 font-JetBrains-Mono uppercase">{label}</p>
      <p className="text-[#E5E7EB] text-2xl font-bold font-Spline-Sans">{value}</p>
    </div>
  );
}
