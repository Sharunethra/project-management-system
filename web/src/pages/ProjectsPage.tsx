import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Project, Pagination } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 9 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/projects', { params });
      setProjects(res.data.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(1);
  };

  const handleCreateOrUpdate = async (projectData: any) => {
    if (editingProject) {
      await api.put(`/projects/${editingProject.id}`, projectData);
    } else {
      await api.post('/projects', projectData);
    }
    fetchProjects(pagination.page);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"? All tasks under it will be deleted.`)) {
      return;
    }
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Projects</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage and monitor progress across your project lifecycle
          </p>
        </div>

        <button
          id="create-project-btn"
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              id="project-search-input"
              type="text"
              className="form-input"
              placeholder="Search projects by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              id="project-filter-status"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <button id="project-search-btn" type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FolderKanban size={48} style={{ color: '#64748b', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Projects Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px', maxWidth: '400px', margin: '6px auto 20px' }}>
            Get started by creating your first project to organize tasks and monitor completion.
          </p>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {projects.map((p) => (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className={`badge badge-${p.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {p.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {p._count?.tasks ?? 0} tasks
                    </span>
                  </div>

                  <Link to={`/projects/${p.id}`} style={{ display: 'block', fontWeight: 700, fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
                    {p.name}
                  </Link>

                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', minHeight: '40px', lineHeight: '1.4', marginBottom: '16px' }}>
                    {p.description || 'No description provided.'}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} />
                      <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    {p.startDate && (
                      <div>Start: {new Date(p.startDate).toLocaleDateString()}</div>
                    )}
                    {p.endDate && (
                      <div>End: {new Date(p.endDate).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                  <Link to={`/projects/${p.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <ExternalLink size={14} />
                    <span>View Tasks</span>
                  </Link>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditingProject(p);
                        setIsModalOpen(true);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      title="Edit Project"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="btn btn-danger"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchProjects(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
              </span>

              <button
                className="btn btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProjects(pagination.page + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        projectToEdit={editingProject}
      />
    </div>
  );
};
