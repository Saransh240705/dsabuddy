import { useEffect, useState } from 'react';
import { Modal } from '@/components/common';
import { userService } from '@/api/services';
import { getInitials } from './LeaderboardRow';
import { Trophy, Award, Calendar, School, BookOpen, Activity, AlertCircle, Link2 } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

import leetcodeLogo from '@/assets/Leetcode Icon 24 copy.png';
import codeforcesLogo from '@/assets/Codeforces Icon 24.png';
import codechefLogo from '@/assets/Codechef Icon 48.png';
import gfgLogo from '@/assets/Geeksforgeeks Icon 48.png';

export function UserProfileModal({ isOpen, onClose, userName }) {
  const { user: currentUser } = useUserStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!isOpen || !userName) {
      setProfile(null);
      setError(null);
      setImgError(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        setImgError(false);
        const res = await userService.getUserByUserName(userName);
        if (res?.user) {
          setProfile(res.user);
        } else {
          setError('User profile details not found.');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setError('Failed to fetch user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isOpen, userName]);

  if (!isOpen) return null;

  const getRankBadge = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  };

  const rankColors = {
    1: '#35b9f1', // gold
    2: '#E5E7EB', // silver
    3: '#CD7F32', // bronze
  };
  const rankColor = rankColors[profile?.overallRank] || '#6B7280';
  const showInitials = imgError || !profile?.avatarUrl;

  const allPlatforms = [
    { id: 'leetcode', name: 'LeetCode', color: '#FFA116', key: 'LEETCODE', logo: leetcodeLogo },
    { id: 'codeforces', name: 'Codeforces', color: '#1F8ACB', key: 'CODEFORCES', logo: codeforcesLogo },
    { id: 'codechef', name: 'CodeChef', color: '#5B4638', key: 'CODECHEF', logo: codechefLogo },
    { id: 'gfg', name: 'GeeksforGeeks', color: '#2F8D46', key: 'GFG', logo: gfgLogo }
  ];

  const isSelf = profile && currentUser && (profile.id === currentUser.id || profile.userName === currentUser.userName);

  const displayConnections = profile ? allPlatforms.map(plat => {
    const conn = (profile.platformConnections || []).find(
      c => c.platform.toUpperCase() === plat.key
    );
    if (conn) {
      return {
        ...plat,
        username: conn.username,
        rating: conn.rating,
        stars: conn.stars,
        problemsSolved: conn.problemsSolved,
        rankLabel: conn.rankLabel,
        synced: conn.synced,
        connected: true
      };
    }
    return {
      ...plat,
      username: null,
      rating: null,
      stars: null,
      problemsSolved: null,
      rankLabel: null,
      synced: false,
      connected: false
    };
  }) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Profile">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-[#35b9f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] font-JetBrains-Mono text-sm">Fetching student profile...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-500 font-bold mb-2 font-Spline-Sans">Error Loading Profile</p>
          <p className="text-[#9CA3AF] text-sm font-JetBrains-Mono max-w-md">{error}</p>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="bg-[#0D1117] rounded-xl p-5 border border-[#1F2937] flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar Column */}
            <div className="relative">
              {showInitials ? (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-[#161B22] border-2 font-bold text-2xl font-Spline-Sans select-none"
                  style={{ borderColor: rankColor, color: rankColor }}
                >
                  {getInitials(profile.name)}
                </div>
              ) : (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  onError={() => setImgError(true)}
                  className="w-20 h-20 rounded-full object-cover border-2"
                  style={{ borderColor: rankColor }}
                />
              )}
            </div>

            {/* Profile Meta Column */}
            <div className="text-center sm:text-left space-y-2 flex-1">
              <div>
                <h3 className="text-[#E5E7EB] text-2xl font-bold font-Spline-Sans flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {profile.name}
                  {profile.overallRank && (
                    <span 
                      className="px-2 py-0.5 rounded text-xs font-bold font-JetBrains-Mono border"
                      style={{
                        color: rankColor,
                        backgroundColor: `${rankColor}15`,
                        borderColor: `${rankColor}30`
                      }}
                    >
                      Rank {getRankBadge(profile.overallRank)}
                    </span>
                  )}
                </h3>
                {(!/^user_\d+$/.test(profile.userName) || isSelf) && (
                  <p className="text-[#9CA3AF] text-sm font-JetBrains-Mono mt-0.5">@{profile.userName}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-[#6B7280] font-JetBrains-Mono">
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5" />
                  {profile.college || 'Netaji Subhas University of Technology'}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {profile.branch || 'Not Specified'}
                </span>
                {profile.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Class of {profile.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ranks & Points Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#161B22] border border-[#1F2937] rounded-xl p-4 text-center">
              <p className="text-[#6B7280] text-[10px] font-JetBrains-Mono tracking-wider uppercase mb-1 flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#35b9f1]" />
                Overall Rank
              </p>
              <p className="text-[#E5E7EB] text-xl font-bold font-Spline-Sans">
                {profile.overallRank ? `#${profile.overallRank}` : '-'}
              </p>
            </div>
            
            <div className="bg-[#161B22] border border-[#1F2937] rounded-xl p-4 text-center">
              <p className="text-[#6B7280] text-[10px] font-JetBrains-Mono tracking-wider uppercase mb-1 flex items-center justify-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                DSA Points
              </p>
              <p className="text-[#35b9f1] text-xl font-bold font-Spline-Sans">
                {typeof profile.points === 'number' ? profile.points.toLocaleString() : String(profile.points ?? 0)}
              </p>
            </div>

            <div className="bg-[#161B22] border border-[#1F2937] rounded-xl p-4 text-center">
              <p className="text-[#6B7280] text-[10px] font-JetBrains-Mono tracking-wider uppercase mb-1 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                Branch Rank
              </p>
              <p className="text-[#E5E7EB] text-xl font-bold font-Spline-Sans">
                {profile.branchRank ? `#${profile.branchRank}` : '-'}
              </p>
            </div>

            <div className="bg-[#161B22] border border-[#1F2937] rounded-xl p-4 text-center">
              <p className="text-[#6B7280] text-[10px] font-JetBrains-Mono tracking-wider uppercase mb-1 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                Year Rank
              </p>
              <p className="text-[#E5E7EB] text-xl font-bold font-Spline-Sans">
                {profile.yearRank ? `#${profile.yearRank}` : '-'}
              </p>
            </div>
          </div>

          {/* Connected Platforms List */}
          <div className="space-y-3">
            <h4 className="text-[#E5E7EB] font-bold font-Spline-Sans text-lg flex items-center gap-2 border-b border-[#1F2937]/50 pb-2">
              <Link2 className="w-5 h-5 text-[#35b9f1]" />
              Platform Connections
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayConnections.map((conn) => {
                return (
                  <div 
                    key={conn.id}
                    className={`
                      rounded-xl p-5 border transition-all space-y-4
                      ${conn.connected 
                        ? 'bg-[#161B22] border-[#1F2937] hover:border-[#35b9f1]/10' 
                        : 'bg-[#161B22]/40 border-dashed border-[#1F2937] opacity-40 hover:opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0D1117] overflow-hidden"
                        >
                          <img 
                            src={conn.logo} 
                            alt={conn.name} 
                            className={`w-6 h-6 object-contain ${conn.connected ? '' : 'grayscale opacity-40'}`} 
                          />
                        </div>
                        <div>
                          <h5 className="text-[#E5E7EB] font-bold font-Spline-Sans text-sm">{conn.name}</h5>
                          {conn.connected ? (
                            isSelf ? (
                              <p className="text-[#6B7280] text-xs font-JetBrains-Mono">
                                @{conn.username}
                              </p>
                            ) : null
                          ) : (
                            <p className="text-[#6B7280] text-xs font-JetBrains-Mono">
                              Not Linked
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-[#0D1117] px-2 py-0.5 rounded border border-[#1F2937]/50">
                        <div className={`w-1.5 h-1.5 rounded-full ${conn.connected && conn.synced ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} />
                        <span className="text-[#6B7280] text-[10px] font-JetBrains-Mono uppercase">
                          {conn.connected ? (conn.synced ? 'Synced' : 'Offline') : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-[#0D1117] rounded-lg p-2.5">
                        <p className="text-[#6B7280] text-[10px] font-JetBrains-Mono uppercase mb-0.5">RATING</p>
                        <p className="text-[#E5E7EB] text-base font-bold font-Spline-Sans">
                          {conn.connected && typeof conn.rating === 'number' ? conn.rating.toLocaleString() : (conn.rating ?? '-')}
                        </p>
                      </div>
                      
                      <div className="bg-[#0D1117] rounded-lg p-2.5">
                        <p className="text-[#6B7280] text-[10px] font-JetBrains-Mono uppercase mb-0.5">
                          {conn.id === 'codechef' ? 'STARS' : 'SOLVED'}
                        </p>
                        <p className="text-[#E5E7EB] text-base font-bold font-Spline-Sans">
                          {conn.connected
                            ? (conn.id === 'codechef' 
                              ? (conn.stars !== undefined && conn.stars !== null ? `${conn.stars}★` : '-') 
                              : (conn.problemsSolved !== undefined && conn.problemsSolved !== null ? conn.problemsSolved : '-'))
                            : '-'
                          }
                        </p>
                      </div>
                    </div>

                    {conn.connected && conn.rankLabel && (
                      <div className="text-xs text-[#6B7280] font-JetBrains-Mono pt-2 border-t border-[#1F2937]/50">
                        RANK: <span className="text-[#E5E7EB] font-medium">{conn.rankLabel}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
