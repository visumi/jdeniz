import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { type Lesson, type LessonInput, type LessonStatusInput, type LessonsDay, type StudentLessons } from "../types/api";

export function useLessons(date: string) {
  return useQuery({
    queryKey: ["lessons", date],
    queryFn: () => apiRequest<LessonsDay>(`/lessons?date=${encodeURIComponent(date)}`),
    enabled: Boolean(date),
    placeholderData: keepPreviousData
  });
}

export function useStudentLessons(id: string | undefined) {
  return useQuery({
    queryKey: ["student-lessons", id],
    queryFn: () => apiRequest<StudentLessons>(`/students/${encodeURIComponent(id!)}/lessons`),
    enabled: Boolean(id)
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LessonInput) => apiRequest<Lesson>("/lessons", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (lesson) => {
      invalidateLessonQueries(queryClient, lesson);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LessonInput }) => apiRequest<Lesson>(`/lessons/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (lesson) => {
      invalidateLessonQueries(queryClient, lesson);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });
}

export function useUpdateLessonStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LessonStatusInput }) => apiRequest<Lesson>(`/lessons/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (lesson) => {
      invalidateLessonQueries(queryClient, lesson);
      queryClient.invalidateQueries({ queryKey: ["student-attendance-summary", lesson.studentId] });
      queryClient.invalidateQueries({ queryKey: ["student", lesson.studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });
}

function invalidateLessonQueries(queryClient: ReturnType<typeof useQueryClient>, lesson: Lesson) {
  queryClient.invalidateQueries({ queryKey: ["lessons"] });
  queryClient.invalidateQueries({ queryKey: ["student-attendance-summary", lesson.studentId] });
  queryClient.invalidateQueries({ queryKey: ["student", lesson.studentId] });
}
