import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trophy, CalendarCheck, Flame, Users, Target, Shield, ArrowUp, RefreshCw } from 'lucide-react';
import { Player, MatchResult, Fixture } from './types/darts';
import {
  getStoredPlayers,
  saveStoredPlayers,
  getStoredMatches,
  saveStoredMatches,
  getStoredAdminPin,
  saveStoredAdminPin,
  getLeagueFixtures,
  resetToDemoData,
  clearAllMatches,
} from './utils/storage';
import {
  fetchRemoteState,
  remoteUpdatePlayers,
  remoteDeletePlayer,
  remoteSaveMatch,
  remoteDeleteMatch,
  remoteResetDemo,
  remoteClearMatches,
  remoteUpdatePin,
  subscribeToLeagueChanges,
} from './utils/cloudSync';
import { calculatePlayerStats } from './utils/statsCalculator';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { StandingsTable } from './components/StandingsTable';
import { LeagueRules } from './components/LeagueRules';
import { Leaderboards } from './components/Leaderboards';
import { FixtureGenerator } from './components/FixtureGenerator';
import { FixturesList } from './components/FixturesList';
import { PlayerProfile } from './components/PlayerProfile';
import { Live301Scorer } from './components/Live301Scorer';
import { AdminPortal } from './components/AdminPortal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ASSETS } from './utils/assets';

export default function App() {
  // Persistence state
  const [players, setPlayers] = useState<Player[]>(() => getStoredPlayers());
  const [matches, setMatches] = useState<MatchResult[]>(() => getStoredMatches());
  const [adminPin, setAdminPin] = useState<string>(() => getStoredAdminPin());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Cloud sync state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('standings');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Modals & workflows
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [selectedFixtureForScore, setSelectedFixtureForScore] = useState<{
    p1Id: string;
    p2Id: string;
    fixtureId: string;
    round: 1 | 2;
  } | null>(null);
  const [editingMatch, setEditingMatch] = useState<MatchResult | null>(null);

  // Save local changes to localStorage as fast client fallback
  useEffect(() => {
    saveStoredPlayers(players);
  }, [players]);

  useEffect(() => {
    saveStoredMatches(matches);
  }, [matches]);

  // Synchronize state with central cloud database
  const syncWithRemote = useCallback(async (showIndicator = false) => {
    if (showIndicator) setSyncStatus('syncing');
    try {
      const remote = await fetchRemoteState();
      if (remote) {
        setPlayers(remote.players);
        setMatches(remote.matches);
        if (remote.adminPin) setAdminPin(remote.adminPin);
        saveStoredPlayers(remote.players);
        saveStoredMatches(remote.matches);
        if (remote.adminPin) saveStoredAdminPin(remote.adminPin);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('offline');
      }
    } catch {
      setSyncStatus('offline');
    }
  }, []);

  // Poll cloud database every 4 seconds, immediately on window focus, and on Supabase Realtime changes
  useEffect(() => {
    syncWithRemote(true);

    const unsubscribeRealtime = subscribeToLeagueChanges(() => {
      syncWithRemote(false);
    });

    const interval = setInterval(() => {
      syncWithRemote(false);
    }, 4000);

    const onFocusOrVisible = () => {
      syncWithRemote(false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithRemote(false);
      }
    };

    window.addEventListener('focus', onFocusOrVisible);
    window.addEventListener('online', onFocusOrVisible);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      unsubscribeRealtime();
      clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      window.removeEventListener('online', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [syncWithRemote]);

  // Derived calculations
  const stats = useMemo(() => calculatePlayerStats(players, matches), [players, matches]);
  const fixtures = useMemo(() => getLeagueFixtures(players, matches), [players, matches]);
  const activePlayers = useMemo(() => players.filter(p => p.active), [players]);

  // Handlers for Match Operations (Syncing to remote cloud database)
  const handleSaveMatchResult = (newOrUpdatedMatch: MatchResult) => {
    setMatches(prev => {
      const existingIndex = prev.findIndex(m => m.id === newOrUpdatedMatch.id || m.fixtureId === newOrUpdatedMatch.fixtureId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newOrUpdatedMatch;
        return next;
      }
      return [...prev, newOrUpdatedMatch];
    });

    setSelectedFixtureForScore(null);
    setEditingMatch(null);

    // Persist to central cloud database
    remoteSaveMatch(newOrUpdatedMatch).then(res => {
      if (res) {
        setMatches(res.matches);
        saveStoredMatches(res.matches);
        setLastSyncTime(new Date());
      }
    });
  };

  const handleDeleteMatchResult = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));

    // Persist to central cloud database
    remoteDeleteMatch(matchId).then(res => {
      if (res) {
        setMatches(res.matches);
        saveStoredMatches(res.matches);
        setLastSyncTime(new Date());
      }
    });
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setMatches(prev => prev.filter(m => m.player1Id !== playerId && m.player2Id !== playerId));
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    }

    // Persist to central cloud database immediately
    remoteDeletePlayer(playerId).then(res => {
      if (res) {
        setPlayers(res.players);
        setMatches(res.matches);
        saveStoredPlayers(res.players);
        saveStoredMatches(res.matches);
        setLastSyncTime(new Date());
      }
    });
  };

  const handleUpdatePlayers = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    saveStoredPlayers(updatedPlayers);

    // Persist to central cloud database immediately
    remoteUpdatePlayers(updatedPlayers).then(res => {
      if (res) {
        setPlayers(res.players);
        setLastSyncTime(new Date());
      }
    });
  };

  const handleResetDemoData = () => {
    remoteResetDemo().then(res => {
      if (res) {
        setPlayers(res.players);
        setMatches(res.matches);
        saveStoredPlayers(res.players);
        saveStoredMatches(res.matches);
        setLastSyncTime(new Date());
      } else {
        const demo = resetToDemoData();
        setPlayers(demo.players);
        setMatches(demo.matches);
      }
    });
  };

  const handleClearMatches = () => {
    remoteClearMatches().then(res => {
      if (res) {
        setMatches(res.matches);
        saveStoredMatches(res.matches);
        setLastSyncTime(new Date());
      } else {
        const cleared = clearAllMatches();
        setMatches(cleared);
      }
    });
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    saveStoredAdminPin(newPin);
    remoteUpdatePin(newPin).then(() => {
      setLastSyncTime(new Date());
    });
  };

  // Launch Score Entry for a specific match
  const handleOpenScoreEntry = (p1Id: string, p2Id: string, fixtureId: string, round: 1 | 2) => {
    setSelectedFixtureForScore({ p1Id, p2Id, fixtureId, round });
    setEditingMatch(null);
    setIsAdminPortalOpen(true);
  };

  // Launch Edit for existing match
  const handleEditMatch = (match: MatchResult) => {
    setEditingMatch(match);
    setSelectedFixtureForScore(null);
    setIsAdminPortalOpen(true);
  };

  // Navigate to player profile
  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setCurrentTab('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Live Scorer completed match bridge
  const handleLiveScorerComplete = (resultData: Partial<MatchResult>) => {
    if (!isAdmin) {
      setIsAdmin(true); // Auto-elevate so user can confirm and save their live game
    }
    const matchId = `m-${Date.now()}`;
    const round: 1 | 2 = 1;
    // Look up fixture ID regardless of player order to ensure exact single round-robin match mapping
    const matchingFixture = fixtures.find(
      f => (f.player1Id === resultData.player1Id && f.player2Id === resultData.player2Id) ||
           (f.player1Id === resultData.player2Id && f.player2Id === resultData.player1Id)
    );
    const fixtureId = matchingFixture?.id || `r1-${resultData.player1Id}-${resultData.player2Id}`;

    const completeResult: MatchResult = {
      id: matchId,
      fixtureId,
      round,
      player1Id: resultData.player1Id!,
      player2Id: resultData.player2Id!,
      player1Legs: resultData.player1Legs!,
      player2Legs: resultData.player2Legs!,
      winnerId: resultData.winnerId!,
      loserId: resultData.loserId!,
      player1Avg: resultData.player1Avg || 0,
      player2Avg: resultData.player2Avg || 0,
      player1180s: resultData.player1180s || 0,
      player2180s: resultData.player2180s || 0,
      player1HighestCheckout: resultData.player1HighestCheckout || 0,
      player2HighestCheckout: resultData.player2HighestCheckout || 0,
      playedAt: new Date().toISOString(),
      notes: 'Recorded via 301 Live Scorer',
    };

    setEditingMatch(completeResult);
    setIsAdminPortalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab !== 'player') setSelectedPlayerId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAdmin={isAdmin}
        onOpenAdminModal={() => {
          if (isAdmin) {
            setIsAdminPortalOpen(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        onLogoutAdmin={() => setIsAdmin(false)}
        syncStatus={syncStatus}
        onManualSync={() => syncWithRemote(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero banner shown on main tabs */}
        {(currentTab === 'standings' || currentTab === 'leaderboards') && (
          <HeroBanner
            onGoToGenerator={() => setCurrentTab('generator')}
            onGoToScorer={() => setCurrentTab('scorer')}
            onGoToRules={() => setCurrentTab('rules')}
            onGoToAdmin={() => {
              if (isAdmin) setIsAdminPortalOpen(true);
              else setIsAdminLoginOpen(true);
            }}
            totalPlayers={activePlayers.length}
            completedMatchesCount={matches.length}
            totalFixturesCount={fixtures.length}
            stats={stats}
            allMatches={matches}
          />
        )}

        {/* Tab 1: Standings */}
        {currentTab === 'standings' && (
          <StandingsTable 
            stats={stats} 
            onSelectPlayer={handleSelectPlayer}
            onGoToRules={() => setCurrentTab('rules')}
          />
        )}

        {/* Tab: Official League Rules & Scoring System */}
        {currentTab === 'rules' && (
          <LeagueRules
            onGoToStandings={() => setCurrentTab('standings')}
            onGoToFixtures={() => setCurrentTab('fixtures')}
            onGoToScorer={() => setCurrentTab('scorer')}
          />
        )}

        {/* Tab 2: Leaderboards */}
        {currentTab === 'leaderboards' && (
          <Leaderboards
            players={players}
            matches={matches}
            stats={stats}
            onSelectPlayer={handleSelectPlayer}
          />
        )}

        {/* Tab 3: Dynamic Fixture Generator */}
        {currentTab === 'generator' && (
          <FixtureGenerator
            players={players}
            completedMatches={matches}
            onOpenScoreEntryForMatch={handleOpenScoreEntry}
            isAdmin={isAdmin}
            onOpenAdminModal={() => setIsAdminLoginOpen(true)}
          />
        )}

        {/* Tab 4: Fixtures & Results List */}
        {currentTab === 'fixtures' && (
          <FixturesList
            players={players}
            fixtures={fixtures}
            matches={matches}
            onSelectPlayer={handleSelectPlayer}
            onOpenScoreEntry={handleOpenScoreEntry}
            onEditMatch={handleEditMatch}
            isAdmin={isAdmin}
            onOpenAdminModal={() => setIsAdminLoginOpen(true)}
          />
        )}

        {/* Tab 5: 301 Live Scorer */}
        {currentTab === 'scorer' && (
          <Live301Scorer
            players={players}
            onCompleteMatch={handleLiveScorerComplete}
          />
        )}

        {/* Tab 6: Player Profile View */}
        {currentTab === 'player' && selectedPlayerId && (
          <PlayerProfile
            playerId={selectedPlayerId}
            players={players}
            matches={matches}
            stats={stats}
            onBack={() => {
              setCurrentTab('standings');
              setSelectedPlayerId(null);
            }}
            onSelectOtherPlayer={id => {
              setSelectedPlayerId(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          setIsAdminLoginOpen(false);
          setIsAdminPortalOpen(true);
        }}
        actualPin={adminPin}
      />

      {/* Admin Portal Modal */}
      {isAdminPortalOpen && (
        <AdminPortal
          players={players}
          fixtures={fixtures}
          matches={matches}
          onSaveMatchResult={handleSaveMatchResult}
          onDeleteMatchResult={handleDeleteMatchResult}
          onUpdatePlayers={handleUpdatePlayers}
          onDeletePlayer={handleDeletePlayer}
          onResetData={handleResetDemoData}
          onClearMatches={handleClearMatches}
          onClose={() => {
            setIsAdminPortalOpen(false);
            setSelectedFixtureForScore(null);
            setEditingMatch(null);
          }}
          initialSelectedFixture={selectedFixtureForScore}
          editingMatch={editingMatch}
          onClearEditingMatch={() => {
            setEditingMatch(null);
            setSelectedFixtureForScore(null);
          }}
          adminPin={adminPin}
          onUpdateAdminPin={handleUpdateAdminPin}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950/80 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-red-600">
              <img
                src={ASSETS.mascotLogo}
                alt="The Smoke Box Mascot"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-sm font-black text-white uppercase tracking-wider">
                The Smoke <span className="text-red-600">Box</span> Darts League
              </span>
              <p className="text-[11px] text-neutral-500">
                301 Double Out · Best of 5 Legs · 3 Pts Win / 0 Pts Loss · Single Round-Robin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span>Local persistence enabled</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => {
                if (isAdmin) {
                  setIsAdminPortalOpen(true);
                } else {
                  setIsAdminLoginOpen(true);
                }
              }}
              className="text-neutral-400 hover:text-white underline font-semibold transition-colors"
            >
              {isAdmin ? 'Open Admin Portal' : 'Admin Login (Default: smokebox)'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
