import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../api/client';
import { Task, Project } from '../types';
import { TaskModal } from './TaskModal';

export const ProjectTasksScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { project } = route.params as { project: Project };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setError(null);
      const params: any = { projectId: project.id, limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.data);
    } catch (err: any) {
      setError(err.customMessage || err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: project.name });
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleCreateOrUpdate = async (taskData: any) => {
    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, taskData);
    } else {
      await api.post('/tasks', taskData);
    }
    fetchTasks();
  };

  // Requirement: Direct action to Mark as completed
  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      fetchTasks();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update task');
    }
  };

  // Requirement: Change task priority
  const handleCyclePriority = async (task: Task) => {
    const nextPriority =
      task.priority === 'Low'
        ? 'Medium'
        : task.priority === 'Medium'
        ? 'High'
        : 'Low';

    try {
      await api.put(`/tasks/${task.id}`, { priority: nextPriority });
      fetchTasks();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update priority');
    }
  };

  // Requirement: Change task status
  const handleCycleStatus = async (task: Task) => {
    const nextStatus =
      task.status === 'Pending'
        ? 'In Progress'
        : task.status === 'In Progress'
        ? 'Completed'
        : 'Pending';

    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      fetchTasks();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tasks/${task.id}`);
              fetchTasks();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchTasks}
        />

        <View style={styles.filterRow}>
          {/* Status filter */}
          <View style={styles.filterGroup}>
            {['', 'Pending', 'In Progress', 'Completed'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.filterChip,
                  statusFilter === s && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(s)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === s && styles.filterChipTextActive,
                  ]}
                >
                  {s === '' ? 'All' : s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySubtitle}>
                Tap "+ Add Task" below to create your first task for this project.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isDone = item.status === 'Completed';
            return (
              <View
                style={[
                  styles.taskCard,
                  isDone && styles.taskCardCompleted,
                ]}
              >
                <View style={styles.taskMain}>
                  {/* Mark completed direct action checkbox */}
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      isDone && styles.checkboxChecked,
                    ]}
                    onPress={() => handleToggleComplete(item)}
                  >
                    {isDone && <Text style={styles.checkmark}>?</Text>}
                  </TouchableOpacity>

                  <View style={styles.taskTextCol}>
                    <Text
                      style={[
                        styles.taskName,
                        isDone && styles.taskNameDone,
                      ]}
                    >
                      {item.name}
                    </Text>

                    {item.description ? (
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Status and Priority interactive chips & actions */}
                <View style={styles.taskActionsRow}>
                  <View style={styles.chipsRow}>
                    <TouchableOpacity
                      style={styles.actionChip}
                      onPress={() => handleCycleStatus(item)}
                    >
                      <Text style={styles.actionChipText}>
                        Status: {item.status} ?
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionChip}
                      onPress={() => handleCyclePriority(item)}
                    >
                      <Text style={styles.actionChipText}>
                        Priority: {item.priority} ?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => {
                        setEditingTask(item);
                        setIsModalOpen(true);
                      }}
                    >
                      <Text style={styles.iconBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(item)}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating Add Task Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingTask(null);
          setIsModalOpen(true);
        }}
      >
        <Text style={styles.fabText}>+ Add Task</Text>
      </TouchableOpacity>

      <TaskModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        taskToEdit={editingTask}
        projectId={project.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  filterSection: {
    padding: 14,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  taskCardCompleted: {
    borderLeftColor: '#10b981',
    opacity: 0.85,
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  taskTextCol: {
    flex: 1,
  },
  taskName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  taskActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionChip: {
    backgroundColor: '#0f172a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  iconBtnText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
});
