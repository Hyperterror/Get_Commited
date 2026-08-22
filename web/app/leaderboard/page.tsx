'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { motion } from 'framer-motion'
import { Trophy, Star, Flame, Shield, Medal, Crown, Users } from 'lucide-react'
import { CONTRACTS, GET_COMMITTED_ABI, getLevelInfo, LEVELS } from '@/lib/contracts'

export default function LeaderboardPage() {
  const { address: userAddress, isConnected } = useAccount()

  // 1. Fetch poolCount
  const { data: poolCount } = useReadContract({
    address: CONTRACTS.GET_COMMITTED,
    abi: GET_COMMITTED_ABI,
    functionName: 'poolCount',
  })

  // 2. Fetch recent pools' participants
  const recentPoolIds = useMemo(() => {
    if (!poolCount) return []
    const count = Number(poolCount)
    const ids = []
    const start = Math.max(1, count - 9)
    for (let i = start; i <= count; i++) {
      ids.push(BigInt(i))
    }
    return ids
  }, [poolCount])

  const { data: participantsData } = useReadContracts({
    contracts: recentPoolIds.map(id => ({
      address: CONTRACTS.GET_COMMITTED,
      abi: GET_COMMITTED_ABI,
      functionName: 'getPoolParticipants',
      args: [id],
    }))
  })

  // 3. Collect unique addresses
  const uniqueAddresses = useMemo(() => {
    if (!participantsData) return []
    const addresses = new Set<string>()
    participantsData.forEach(result => {
      if (result.status === 'success' && Array.isArray(result.result)) {
        result.result.forEach(addr => addresses.add(addr as string))
      }
    })
    return Array.from(addresses) as `0x${string}`[]
  }, [participantsData])

  // 4. Fetch user profiles
  const { data: profilesData, isLoading: profilesLoading } = useReadContracts({
    contracts: uniqueAddresses.map(addr => ({
      address: CONTRACTS.GET_COMMITTED,
      abi: GET_COMMITTED_ABI,
      functionName: 'getUserProfile',
      args: [addr],
    }))
  })

  // 5. Rank by XP
  const leaderboardData = useMemo(() => {
    if (!profilesData || !uniqueAddresses.length) return []
    
    const data = profilesData.map((result, index) => {
      if (result.status === 'success' && result.result) {
        const [xp, streak, level, hasShield] = result.result as unknown as [bigint, bigint, bigint, boolean]
        return {
          address: uniqueAddresses[index],
          xp: Number(xp),
          streak: Number(streak),
          level: Number(level),
          hasShield,
        }
      }
      return null
    }).filter(Boolean) as { address: `0x${string}`, xp: number, streak: number, level: number, hasShield: boolean }[]
    
    return data.sort((a, b) => b.xp - a.xp)
  }, [profilesData, uniqueAddresses])

  const isLoading = !poolCount || profilesLoading

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col items-center justify-center p-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--sage-faint)] flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-[var(--sage-dark)]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard</h2>
          <p className="text-gray-500 mb-6">Connect your wallet to view the top performers on Monad testnet.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--sage)] to-[var(--sage-dark)] flex items-center justify-center text-white mb-2 shadow-lg"
        >
          <Trophy className="w-8 h-8" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 max-w-md">
          Top performers on Monad testnet
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-[var(--sage-dark)] font-medium">
            <Users className="w-5 h-5" />
            <span>Top Committers</span>
          </div>
          <div className="text-sm text-gray-500">
            {leaderboardData.length} participants found
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : leaderboardData.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col"
          >
            {leaderboardData.map((user, index) => {
              const rank = index + 1
              const levelInfo = getLevelInfo(user.level)
              const isCurrentUser = userAddress?.toLowerCase() === user.address.toLowerCase()
              
              return (
                <motion.div 
                  key={user.address}
                  variants={itemVariants}
                  className={`
                    flex items-center justify-between p-4 border-b border-gray-100 last:border-0 transition-colors
                    ${isCurrentUser ? 'bg-[var(--sage-faint)]' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 font-bold text-gray-400 flex justify-center">
                      {rank === 1 ? <Crown className="w-6 h-6 text-yellow-500" /> :
                       rank === 2 ? <Medal className="w-6 h-6 text-gray-400" /> :
                       rank === 3 ? <Medal className="w-6 h-6 text-amber-600" /> :
                       <span className="text-gray-400">#{rank}</span>}
                    </div>
                    
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 text-xl">
                      {levelInfo.emoji}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-gray-900">
                          {isCurrentUser ? 'You' : formatAddress(user.address)}
                        </span>
                        {user.hasShield && (
                          <Shield className="w-4 h-4 text-blue-500 fill-blue-100" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--sage-dark)] font-medium">{levelInfo.name}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          Level {user.level}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-gray-900 flex items-center gap-1 justify-end">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {user.xp.toLocaleString()} XP
                      </div>
                      {user.streak > 0 && (
                        <div className="text-sm text-orange-500 font-medium flex items-center gap-1 justify-end">
                          <Flame className="w-3 h-3 fill-orange-500" />
                          {user.streak} day streak
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No participants found in recent pools.
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-500 pt-4">
        <p>Leaderboard shows participants from the latest pools. XP and levels are fully on-chain.</p>
      </div>
    </div>
  )
}
