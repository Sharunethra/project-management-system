import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  RotateCw,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await api.get('/dashboard');
      setStats(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>System Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Real-time project metrics & task execution status
          </p>
        </div>

        <button
          id="dashboard-refresh-btn"
          onClick={() => fetchStats(true)}
          className="btn btn-secondary"
          disabled={loading || refreshing}
        >
          <RotateCw size={16} className={refreshing ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : (
        <>
          {/* Top 5 Mandatory Statistics */}
          <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
            <StatCard
              title="Total Projects"
              value={stats?.totalProjects ?? 0}
              icon={FolderKanban}
              color="indigo"
            />
            <StatCard
              title="Projects In Progress"
              value={stats?.projectsInProgress ?? 0}
              icon={Activity}
              color="blue"
            />
            <StatCard
              title="Total Tasks"
              value={stats?.totalTasks ?? 0}
              icon={Layers}
              color="purple"
            />
            <StatCard
              title="Pending Tasks"
              value={stats?.pendingTasks ?? 0}
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="Completed Tasks"
              value={stats?.completedTasks ?? 0}
              icon={CheckCircle2}
              color="emerald"
            />
          </div>

          {/* Quick Actions & Recent Overview */}
          <div className="grid-cols-2">
            {/* Recent Projects */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Projects</h3>
                <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.recentProjects.map((p) => (
                    <Link
                      to={`/projects/${p.id}`}
                      key={p.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Created: {new Date(p.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`badge badge-${p.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {p.status}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No projects created yet.</p>
              )}
            </div>

            {/* Recent Tasks */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Tasks</h3>
                <Link to="/tasks" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {stats?.recentTasks && stats.recentTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.recentTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {t.project?.name || 'Project'} • Priority: {t.priority}
                        </div>
                      </div>
                      <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No tasks created yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
