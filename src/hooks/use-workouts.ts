import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { type Workout, type WorkoutInput } from "../types/api";

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
    }
  });
}
