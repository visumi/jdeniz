import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { type Workout, type WorkoutInput, type WorkoutOverviewPage, type WorkoutOverviewStatus } from "../types/api";

export function useWorkouts(studentId: string | undefined) {
  return useQuery({
    queryKey: ["workouts", studentId],
    queryFn: () => apiRequest<Workout[]>(`/students/${encodeURIComponent(studentId!)}/workouts`),
    enabled: Boolean(studentId)
  });
}

export function useCreateWorkout(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkoutInput) => apiRequest<Workout>(`/students/${encodeURIComponent(studentId)}/workouts`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts", studentId] });
      queryClient.invalidateQueries({ queryKey: ["workout-overview"] });
    }
  });
}

export function useWorkoutOverview(options: { page: number; search: string; status: WorkoutOverviewStatus | ""; enabled?: boolean }) {
  return useQuery({
    queryKey: ["workout-overview", options],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(options.page) });
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      return apiRequest<WorkoutOverviewPage>(`/workouts/overview?${params.toString()}`);
    },
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: 30_000
  });
}
