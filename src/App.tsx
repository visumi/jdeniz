import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "./components/auth-guard";
import { AppShell } from "./components/app-shell";
import { AuthProvider } from "./hooks/use-auth";
import { AccountPage } from "./features/account/account-page";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { LoginPage } from "./features/login/login-page";
import { StudentDetailPage } from "./features/students/student-detail-page";
import { StudentForm } from "./features/students/student-form";
import { StudentsPage } from "./features/students/students-page";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

export function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<AuthGuard />}><Route element={<AppShell />}><Route index element={<Navigate to="/dashboard" replace />} /><Route path="dashboard" element={<DashboardPage />} /><Route path="students" element={<StudentsPage />} /><Route path="students/new" element={<StudentForm />} /><Route path="students/:id" element={<StudentDetailPage />} /><Route path="students/:id/edit" element={<StudentDetailPage edit />} /><Route path="account" element={<AccountPage />} /></Route></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></BrowserRouter></AuthProvider></QueryClientProvider>;
}
