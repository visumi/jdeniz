import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { type Student, type StudentInput } from "../types/api";

export function useStudents(search = "", options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["students", search],
    queryFn: () => apiRequest<Student[]>(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    enabled: options?.enabled ?? true,
    staleTime: 30_000
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: () => apiRequest<Student>(`/students/${encodeURIComponent(id!)}`),
    enabled: Boolean(id)
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StudentInput) => apiRequest<Student>("/students", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (student) => {
      queryClient.setQueryData(["student", student.id], student);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StudentInput) => apiRequest<Student>(`/students/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (student) => {
      queryClient.setQueryData(["student", student.id], student);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  });
}
