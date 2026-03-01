import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useXeroxExpress } from "@/hooks/useXeroxExpress";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ListChecks,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

type ConfirmAction =
  | { type: "delete"; id: string; name: string }
  | {
      type: "reorder";
      fromIndex: number;
      direction: "up" | "down";
      name: string;
    }
  | null;

export function XeroxExpressCard() {
  const {
    activeTasks,
    deletedTasks,
    addTask,
    toggleTask,
    softDelete,
    restore,
    reorder,
  } = useXeroxExpress();

  const [newTaskName, setNewTaskName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      addTask(newTaskName.trim());
      setNewTaskName("");
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddTask();
    if (e.key === "Escape") {
      setShowInput(false);
      setNewTaskName("");
    }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") {
      softDelete(confirmAction.id);
    } else if (confirmAction.type === "reorder") {
      reorder(confirmAction.fromIndex, confirmAction.direction);
    }
    setConfirmAction(null);
  };

  const daysRemaining = (deletedAt: number | null): number => {
    if (!deletedAt) return 0;
    const elapsed = Date.now() - deletedAt;
    const remaining = 7 - Math.floor(elapsed / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  };

  return (
    <>
      <Card className="border-border shadow-card-dark overflow-hidden">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-primary" />
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Xerox Express
              </h2>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-primary hover:bg-primary/10"
              onClick={() => {
                setShowInput(true);
                setTimeout(
                  () => document.getElementById("new-task-input")?.focus(),
                  50,
                );
              }}
              aria-label="Add task"
            >
              <Plus size={16} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-4 ml-6">Task list</p>

          {/* Add new task input */}
          {showInput && (
            <div className="flex gap-2 mb-3">
              <Input
                id="new-task-input"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter task name…"
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleAddTask}
                disabled={!newTaskName.trim()}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  setShowInput(false);
                  setNewTaskName("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Active tasks */}
          {activeTasks.length === 0 && !showInput && (
            <p className="text-xs text-muted-foreground text-center py-3 italic">
              No tasks yet — tap + to add one
            </p>
          )}

          <div className="space-y-1">
            {activeTasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-2 group rounded-md px-1 py-1.5 hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.checked}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="shrink-0"
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={cn(
                    "flex-1 text-sm cursor-pointer select-none",
                    task.checked && "line-through text-muted-foreground",
                  )}
                >
                  {task.name}
                </label>

                {/* Reorder & delete controls */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    disabled={index === 0}
                    onClick={() =>
                      setConfirmAction({
                        type: "reorder",
                        fromIndex: index,
                        direction: "up",
                        name: task.name,
                      })
                    }
                    aria-label="Move up"
                  >
                    <ChevronUp size={13} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    disabled={index === activeTasks.length - 1}
                    onClick={() =>
                      setConfirmAction({
                        type: "reorder",
                        fromIndex: index,
                        direction: "down",
                        name: task.name,
                      })
                    }
                    aria-label="Move down"
                  >
                    <ChevronDown size={13} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setConfirmAction({
                        type: "delete",
                        id: task.id,
                        name: task.name,
                      })
                    }
                    aria-label="Delete task"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Soft-deleted tasks */}
          {deletedTasks.length > 0 && (
            <>
              <Separator className="my-3" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                Recently deleted
              </p>
              <div className="space-y-1">
                {deletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-md px-1 py-1.5 bg-muted/20"
                  >
                    <div className="w-4 shrink-0" />
                    <span className="flex-1 text-sm line-through text-muted-foreground/60 select-none">
                      {task.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0">
                      {daysRemaining(task.deletedAt)}d left
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                      onClick={() => restore(task.id)}
                      aria-label="Restore task"
                    >
                      <RotateCcw size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete"
                ? "Delete this item?"
                : "Reorder this item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete" ? (
                <>
                  <span className="font-medium text-foreground">
                    "{confirmAction.name}"
                  </span>{" "}
                  will be moved to the deleted section and permanently removed
                  after 7 days.
                </>
              ) : (
                <>
                  Move{" "}
                  <span className="font-medium text-foreground">
                    "{confirmAction?.name}"
                  </span>{" "}
                  {confirmAction?.type === "reorder"
                    ? confirmAction.direction
                    : ""}
                  ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmAction?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmAction?.type === "delete" ? "Delete" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
