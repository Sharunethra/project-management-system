import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await api.get('/dashboard');
      setStats(res.data.data);
    } catch (err: any) {
      setError(err.customMessage || err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      >
        {/* Top Header Card */}
        <View style={styles.userCard}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.fullName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && !stats ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Overview Statistics</Text>

            {/* 5 PDF-Mandatory Statistics */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: '#6366f1' }]}>
                <Text style={styles.statLabel}>Total Projects</Text>
                <Text style={[styles.statValue, { color: '#818cf8' }]}>
                  {stats?.totalProjects ?? 0}
                </Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={styles.statLabel}>Projects In Progress</Text>
                <Text style={[styles.statValue, { color: '#60a5fa' }]}>
                  {stats?.projectsInProgress ?? 0}
                </Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#a855f7' }]}>
                <Text style={styles.statLabel}>Total Tasks</Text>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>
                  {stats?.totalTasks ?? 0}
                </Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={styles.statLabel}>Pending Tasks</Text>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>
                  {stats?.pendingTasks ?? 0}
                </Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.statLabel}>Completed Tasks</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>
                  {stats?.completedTasks ?? 0}
                </Text>
              </View>
            </View>

            {/* Navigation Button to Projects */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Projects')}
            >
              <Text style={styles.actionBtnText}>View All Projects & Tasks ?</Text>
            </TouchableOpacity>

            <Text style={styles.refreshHint}>
              Pull down to refresh metrics anytime
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  greeting: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  actionBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  refreshHint: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
});
