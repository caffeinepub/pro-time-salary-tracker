import { useCallback, useEffect, useState } from "react";

export interface XeroxTask {
  id: string;
  name: string;
  checked: boolean;
  deletedAt: number | null; // timestamp in ms, null if active
}

interface XeroxExpressState {
  tasks: XeroxTask[];
  lastOpenedDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = "xeroxExpressState";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadState(): XeroxExpressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as XeroxExpressState;
  } catch {
    // ignore
  }
  return { tasks: [], lastOpenedDate: "" };
}

function saveState(state: XeroxExpressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useXeroxExpress() {
  const [tasks, setTasks] = useState<XeroxTask[]>([]);

  // Initialize: load state, purge expired soft-deletes, reset ticks if new day
  useEffect(() => {
    const today = getTodayDateString();
    const stored = loadState();
    const now = Date.now();

    // Purge soft-deleted items older than 7 days
    let purged = stored.tasks.filter(
      (t) => !(t.deletedAt !== null && now - t.deletedAt > SEVEN_DAYS_MS),
    );

    // Daily tick reset: if last opened date differs from today, reset all ticks
    if (stored.lastOpenedDate !== today) {
      purged = purged.map((t) => ({ ...t, checked: false }));
    }

    const newState: XeroxExpressState = {
      tasks: purged,
      lastOpenedDate: today,
    };

    saveState(newState);
    setTasks(purged);
  }, []);

  const persist = useCallback((updatedTasks: XeroxTask[]) => {
    setTasks(updatedTasks);
    const today = getTodayDateString();
    saveState({ tasks: updatedTasks, lastOpenedDate: today });
  }, []);

  const addTask = useCallback(
    (name: string) => {
      const newTask: XeroxTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: name.trim(),
        checked: false,
        deletedAt: null,
      };
      persist([...tasks, newTask]);
    },
    [tasks, persist],
  );

  const toggleTask = useCallback(
    (id: string) => {
      persist(
        tasks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)),
      );
    },
    [tasks, persist],
  );

  const softDelete = useCallback(
    (id: string) => {
      persist(
        tasks.map((t) => (t.id === id ? { ...t, deletedAt: Date.now() } : t)),
      );
    },
    [tasks, persist],
  );

  const restore = useCallback(
    (id: string) => {
      persist(tasks.map((t) => (t.id === id ? { ...t, deletedAt: null } : t)));
    },
    [tasks, persist],
  );

  const reorder = useCallback(
    (fromIndex: number, direction: "up" | "down") => {
      const activeTasks = tasks.filter((t) => t.deletedAt === null);
      const deletedTasks = tasks.filter((t) => t.deletedAt !== null);
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= activeTasks.length) return;
      const reordered = [...activeTasks];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      persist([...reordered, ...deletedTasks]);
    },
    [tasks, persist],
  );

  const activeTasks = tasks.filter((t) => t.deletedAt === null);
  const deletedTasks = tasks
    .filter((t) => t.deletedAt !== null)
    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));

  return {
    activeTasks,
    deletedTasks,
    addTask,
    toggleTask,
    softDelete,
    restore,
    reorder,
  };
}
