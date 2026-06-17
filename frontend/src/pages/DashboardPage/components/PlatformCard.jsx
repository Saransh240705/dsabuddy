export function PlatformCard({ platform }) {
  const platformColors = {
    leetcode: '#FFA116',
    codechef: '#5B4638',
    codeforces: '#1F8ACB',
    gfg: '#2F8D46',
  };

  const color = platformColors[platform?.id] || '#35b9f1';
  const isSynced = platform?.synced !== false;

  return (
    <div className="bg-[#161B22] rounded-xl p-6 border border-[#1F2937] hover:border-[#35b9f1]/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            {platform?.logo ? (
              <img 
                src={platform.logo} 
                alt={platform.name} 
                className={`w-7 h-7 object-contain ${platform?.username && platform?.username !== 'Not Connected' ? '' : 'grayscale opacity-40'}`} 
              />
            ) : (
              <span className="text-xl font-bold" style={{ color }}>{platform?.name?.[0] || 'L'}</span>
            )}
          </div>
          <div>
            <h4 className="text-[#E5E7EB] font-bold font-Spline-Sans">{platform?.name || 'LeetCode'}</h4>
            <p className="text-[#6B7280] text-xs font-JetBrains-Mono">@{platform?.username || 'alexcode'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} />
          <span className="text-[#6B7280] text-xs font-JetBrains-Mono">{isSynced ? 'Synced' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0D1117] rounded-lg p-3">
          <p className="text-[#6B7280] text-xs mb-1 font-JetBrains-Mono">RATING</p>
          <p className="text-[#E5E7EB] text-xl font-bold font-Spline-Sans">
            {platform?.rating !== undefined && platform?.rating !== null ? platform.rating.toLocaleString() : '-'}
          </p>
        </div>
        <div className="bg-[#0D1117] rounded-lg p-3">
          <p className="text-[#6B7280] text-xs mb-1 font-JetBrains-Mono">
            {platform?.id === 'codechef' ? 'STARS' : 'SOLVED'}
          </p>
          <p className="text-[#E5E7EB] text-xl font-bold font-Spline-Sans">
            {platform?.id === 'codechef' 
              ? (platform?.stars !== undefined && platform?.stars !== null ? `${platform.stars}★` : '-') 
              : (platform?.problemsSolved !== undefined && platform?.problemsSolved !== null ? platform.problemsSolved : '-')}
          </p>
        </div>
      </div>

      {platform?.rank && (
        <div className="mt-3 pt-3 border-t border-[#1F2937]">
          <p className="text-[#6B7280] text-xs font-JetBrains-Mono">
            RANK: <span className="text-[#E5E7EB]">{platform.rank}</span>
          </p>
        </div>
      )}
    </div>
  );
}
