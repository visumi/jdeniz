import { AlertCircle, CheckCircle2, Clock3, Dumbbell, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "../../lib/utils";
import { StudentAvatar } from "../../components/student-avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { useStudents } from "../../hooks/use-students";
import { formatDateOnly } from "../../lib/utils";
import { type Student } from "../../types/api";
import { StudentForm } from "./student-form";

type StatusFilter = "all" | "expired" | "dueSoon" | "active" | "noTraining";
type StatusTone = "red" | "amber" | "green" | "slate";

const statusTones: Record<StatusTone, { surface: string; selected: string; icon: string; label: string }> = {
  red: { surface: "border-red-100 bg-red-50/60 text-red-950 hover:border-red-200 hover:bg-red-50", selected: "border-red-600 bg-red-600 text-white", icon: "bg-red-100 text-red-700", label: "text-red-700" },
  amber: { surface: "border-amber-100 bg-amber-50/60 text-amber-950 hover:border-amber-200 hover:bg-amber-50", selected: "border-amber-500 bg-amber-500 text-white", icon: "bg-amber-100 text-amber-700", label: "text-amber-800" },
  green: { surface: "border-emerald-100 bg-emerald-50/60 text-emerald-950 hover:border-emerald-200 hover:bg-emerald-50", selected: "border-emerald-600 bg-emerald-600 text-white", icon: "bg-emerald-100 text-emerald-700", label: "text-emerald-800" },
  slate: { surface: "border-slate-200 bg-slate-50/70 text-slate-950 hover:border-slate-300 hover:bg-slate-50", selected: "border-slate-700 bg-slate-700 text-white", icon: "bg-white text-slate-600", label: "text-slate-700" }
};

export function StudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(() => searchParams.get("new") === "1");
  const students = useStudents();
  const allStudents = students.data || [];
  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return allStudents.filter((student) => {
      const matchesSearch = !normalizedSearch || [student.name, student.email, student.phone, student.pathology].filter(Boolean).some((value) => value!.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
      const matchesStatus = statusFilter === "all" || (statusFilter === "noTraining" && !hasTraining(student)) || (statusFilter === "expired" && false) || (statusFilter === "dueSoon" && false) || (statusFilter === "active" && false);
      return matchesSearch && matchesStatus;
    });
  }, [allStudents, search, statusFilter]);

  const statusItems = [
    { key: "expired" as const, label: "Vencidos", count: 0, icon: AlertCircle, tone: "red" as const },
    { key: "dueSoon" as const, label: "Vencem em 7 dias", count: 0, icon: Clock3, tone: "amber" as const },
    { key: "active" as const, label: "Ativos", count: 0, icon: CheckCircle2, tone: "green" as const },
    { key: "noTraining" as const, label: "Sem treino", count: allStudents.filter((student) => !hasTraining(student)).length, icon: Dumbbell, tone: "slate" as const }
  ];

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (searchParams.has("new")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("new");
      setSearchParams(nextParams, { replace: true });
    }
  };

  return <div className="space-y-7">
    <Card className="border-red-200"><CardHeader className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700"><Dumbbell className="size-4" /></span><CardTitle>Treinos a vencer</CardTitle></div></CardHeader><CardContent className="grid grid-cols-2 gap-2 p-3 pt-0 sm:grid-cols-4 sm:p-4 sm:pt-0">{statusItems.map((item) => { const Icon = item.icon; const tone = statusTones[item.tone]; const selected = statusFilter === item.key; return <button key={item.key} type="button" aria-pressed={selected} className={cn("group flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 sm:p-4", selected ? tone.selected : tone.surface)} onClick={() => setStatusFilter(item.key)}><span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", selected ? "bg-white/15 text-white" : tone.icon)}><Icon className="size-4" /></span><span className="min-w-0"><span className="block text-2xl font-bold tracking-tight">{students.isPending ? "—" : item.count}</span><span className={cn("block truncate text-xs font-semibold", selected ? "text-white/80" : tone.label)}>{item.label}</span></span></button>; })}</CardContent></Card>
    <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-sky-100 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><CardTitle>Cadastros de alunos</CardTitle><p className="mt-1 text-sm text-slate-600">{students.isPending ? "Carregando cadastros…" : `${filteredStudents.length} ${filteredStudents.length === 1 ? "cadastro encontrado" : "cadastros encontrados"}`}</p></div><Button type="button" size="sm" className="shrink-0" onClick={() => setDrawerOpen(true)}><Plus className="size-4" />Adicionar aluno</Button></div><div className="relative w-full sm:max-w-xs"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou contato" className="border-sky-200 bg-white pl-9" aria-label="Filtrar cadastros de alunos" /></div></CardHeader><CardContent className="p-0">{students.isPending ? <LoadingState /> : students.isError ? <ErrorState onRetry={() => void students.refetch()} /> : filteredStudents.length === 0 ? <EmptyState hasFilters={Boolean(search || statusFilter !== "all")} onCreate={() => setDrawerOpen(true)} /> : <><MobileStudentList students={filteredStudents} /><DesktopStudentTable students={filteredStudents} /></>}</CardContent></Card>
    <StudentForm drawer open={drawerOpen} onClose={closeDrawer} />
  </div>;
}

function hasTraining(_student: Student) {
  return false;
}

function isComplete(student: Student) {
  return Boolean(student.name && student.attendanceMode && student.birthDate && student.startDate);
}

function StudentStatus({ student }: { student: Student }) {
  return isComplete(student) ? <Badge className="bg-emerald-50 text-emerald-700">Completo</Badge> : <Badge className="bg-amber-50 text-amber-700">Pendente</Badge>;
}

function MobileStudentList({ students }: { students: Student[] }) {
  return <div className="space-y-2 p-3 md:hidden">{students.map((student) => <Link key={student.id} to={`/students/${student.id}`} className="group flex items-center gap-3 rounded-xl border border-sky-100 bg-white p-3 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 focus-visible:bg-sky-50"><span className="transition-transform duration-200 group-hover:scale-105"><StudentAvatar name={student.name} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-semibold text-slate-950">{student.name}</span><StudentStatus student={student} /></span><span className="mt-1 block truncate text-xs text-slate-600">{student.attendanceMode ? student.attendanceMode === "online" ? "Online" : "Presencial" : "Modalidade pendente"} · Início {formatDateOnly(student.startDate)}</span></span><span className="text-sky-600">→</span></Link>)}</div>;
}

function DesktopStudentTable({ students }: { students: Student[] }) {
  return <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-sky-100 bg-sky-50/60 text-xs font-semibold text-slate-600"><tr><th scope="col" className="px-5 py-3">Aluno</th><th scope="col" className="px-4 py-3">Modalidade</th><th scope="col" className="px-4 py-3">Nascimento</th><th scope="col" className="px-4 py-3">Início</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-sky-100">{students.map((student) => <tr key={student.id} className="transition-colors duration-200 hover:bg-sky-50/60"><td className="px-5 py-4"><Link to={`/students/${student.id}`} className="group flex min-w-44 items-center gap-3 focus-visible:rounded-lg"><span className="transition-transform duration-200 group-hover:scale-105"><StudentAvatar name={student.name} /></span><span className="min-w-0"><span className="block truncate font-semibold text-slate-950">{student.name}</span><span className="block truncate text-xs text-slate-600">{student.email || student.phone || "Cadastro básico"}</span></span></Link></td><td className="px-4 py-4 text-slate-700">{student.attendanceMode === "online" ? "Online" : student.attendanceMode === "presencial" ? "Presencial" : "—"}</td><td className="px-4 py-4 text-slate-700">{formatDateOnly(student.birthDate)}</td><td className="px-4 py-4 text-slate-700">{formatDateOnly(student.startDate)}</td><td className="px-4 py-4"><StudentStatus student={student} /></td><td className="px-5 py-4 text-right"><Link to={`/students/${student.id}`} className="cursor-pointer font-semibold text-sky-700 hover:text-sky-900">Abrir</Link></td></tr>)}</tbody></table></div>;
}

function LoadingState() {
  return <div className="space-y-2 p-3">{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-sky-100 p-3"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-2.5 w-1/3" /></div></div>)}</div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div role="alert" className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center"><span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600"><AlertCircle className="size-5" /></span><div className="flex-1"><p className="font-semibold text-slate-950">Não foi possível carregar os alunos.</p><p className="mt-1 text-sm text-slate-600">Verifique sua conexão e tente novamente.</p></div><Button type="button" variant="secondary" onClick={onRetry}>Tentar novamente</Button></div>;
}

function EmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return <div className="flex flex-col items-center px-5 py-14 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-600"><CheckCircle2 className="size-5" /></span><p className="mt-4 font-semibold text-slate-950">{hasFilters ? "Nenhum cadastro corresponde aos filtros." : "Sua base ainda está vazia."}</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{hasFilters ? "Tente buscar por outro nome ou selecionar outro status." : "Cadastre seu primeiro aluno para começar a acompanhar sua base."}</p>{!hasFilters && <Button type="button" variant="secondary" className="mt-5" onClick={onCreate}><Plus className="size-4" />Cadastrar primeiro aluno</Button>}</div>;
}
