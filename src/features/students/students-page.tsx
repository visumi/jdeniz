import { AlertCircle, Cake, CalendarDays, CheckCircle2, Mail, Phone, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StudentAvatar } from "../../components/student-avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { useStudents } from "../../hooks/use-students";
import { cn, formatDateCompact, formatDateOnly } from "../../lib/utils";
import { type Student } from "../../types/api";
import { StudentForm } from "./student-form";
import { Badge } from "../../components/ui/badge";

export function StudentsPage() {
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(() => searchParams.get("new") === "1");
  const students = useStudents();
  const allStudents = students.data || [];
  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return allStudents.filter((student) => {
      return !normalizedSearch || [student.name, student.email, student.phone].filter(Boolean).some((value) => value!.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
    });
  }, [allStudents, search]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (searchParams.has("new")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("new");
      setSearchParams(nextParams, { replace: true });
    }
  };

  return <div className="space-y-7">
    <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-sky-100 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><CardTitle>Cadastros de alunos</CardTitle><p className="mt-1 text-sm text-slate-600">{students.isPending ? "Carregando cadastros…" : `${filteredStudents.length} ${filteredStudents.length === 1 ? "cadastro encontrado" : "cadastros encontrados"}`}</p></div><Button type="button" size="sm" className="shrink-0" onClick={() => setDrawerOpen(true)}><Plus className="size-4" />Adicionar aluno</Button></div><div className="relative w-full sm:max-w-xs"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou contato" className="border-sky-200 bg-white pl-9" aria-label="Filtrar cadastros de alunos" /></div></CardHeader><CardContent className="p-0">{students.isPending ? <LoadingState /> : students.isError ? <ErrorState onRetry={() => void students.refetch()} /> : filteredStudents.length === 0 ? <EmptyState hasFilters={Boolean(search)} onCreate={() => setDrawerOpen(true)} /> : <><MobileStudentList students={filteredStudents} /><DesktopStudentTable students={filteredStudents} /></>}</CardContent></Card>
    <StudentForm drawer open={drawerOpen} onClose={closeDrawer} />
  </div>;
}

function MobileStudentList({ students }: { students: Student[] }) {
  return <div className="space-y-2 p-3 md:hidden">{students.map((student) => <Link key={student.id} to={`/students/${student.id}`} className="group/student-card block rounded-xl border border-sky-100 bg-white p-3 transition-[background-color,border-color] duration-200 hover:border-sky-200 hover:bg-sky-50 focus-visible:bg-sky-50"><div className="flex items-start gap-3"><span className="shrink-0 transition-transform duration-200 group-hover/student-card:scale-105"><StudentAvatar name={student.name} /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="min-w-0 truncate text-sm font-semibold text-slate-950">{student.name}</span><AttendanceBadge mode={student.attendanceMode} className="shrink-0" /></span><span className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-600">{student.phone ? <><Phone aria-hidden="true" className="size-3.5 shrink-0 text-sky-600" /><span className="truncate">{student.phone}</span></> : student.email ? <><Mail aria-hidden="true" className="size-3.5 shrink-0 text-sky-600" /><span className="truncate">{student.email}</span></> : <span className="text-slate-400">Contato não informado</span>}</span><span className="mt-2 flex items-center gap-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5" title="Data de nascimento"><Cake aria-hidden="true" className="size-3.5 text-sky-600" /><span className="sr-only">Data de nascimento: </span>{formatDateCompact(student.birthDate)}</span><span className="inline-flex items-center gap-1.5" title="Data de início"><CalendarDays aria-hidden="true" className="size-3.5 text-sky-600" /><span className="sr-only">Data de início: </span>{formatDateCompact(student.startDate)}</span></span></span></div>{student.observations && <span className="sr-only">Observações: {student.observations}</span>}</Link>)}</div>;
}

function DesktopStudentTable({ students }: { students: Student[] }) {
  const navigate = useNavigate();
  return <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-sky-100 bg-sky-50/60 text-xs font-semibold text-slate-600"><tr><th scope="col" className="px-5 py-3">Aluno</th><th scope="col" className="px-4 py-3">Modalidade</th><th scope="col" className="px-4 py-3">Nascimento</th><th scope="col" className="px-5 py-3">Início</th></tr></thead><tbody className="divide-y divide-sky-100">{students.map((student) => <tr key={student.id} role="link" tabIndex={0} aria-label={`Abrir cadastro de ${student.name}`} className="group/student-row cursor-pointer transition-colors duration-200 hover:bg-sky-50/60 focus-visible:bg-sky-50" onClick={() => navigate(`/students/${student.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/students/${student.id}`); } }}><td className="px-5 py-4"><div className="flex min-w-44 items-center gap-3"><span className="transition-transform duration-200 group-hover/student-row:scale-105"><StudentAvatar name={student.name} /></span><span className="min-w-0"><span className="block truncate font-semibold text-slate-950">{student.name}</span><span className="block truncate text-xs text-slate-600">{student.email || student.phone || "Cadastro básico"}</span></span></div></td><td className="px-4 py-4"><AttendanceBadge mode={student.attendanceMode} /></td><td className="px-4 py-4 text-slate-700">{formatDateOnly(student.birthDate)}</td><td className="px-5 py-4 text-slate-700">{formatDateOnly(student.startDate)}</td></tr>)}</tbody></table></div>;
}

function AttendanceBadge({ mode, className }: { mode: Student["attendanceMode"]; className?: string }) {
  return <Badge variant={mode ? "secondary" : "outline"} className={cn("w-fit", mode ? "bg-sky-50 text-sky-700" : "text-slate-500", className)}>{mode === "online" ? "Online" : mode === "presencial" ? "Presencial" : "Modalidade não informada"}</Badge>;
}

function LoadingState() {
  return <div className="space-y-2 p-3">{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-sky-100 p-3"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-2.5 w-1/3" /></div></div>)}</div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div role="alert" className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center"><span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600"><AlertCircle className="size-5" /></span><div className="flex-1"><p className="font-semibold text-slate-950">Não foi possível carregar os alunos.</p><p className="mt-1 text-sm text-slate-600">Verifique sua conexão e tente novamente.</p></div><Button type="button" variant="secondary" onClick={onRetry}>Tentar novamente</Button></div>;
}

function EmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return <div className="flex flex-col items-center px-5 py-14 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-600"><CheckCircle2 className="size-5" /></span><p className="mt-4 font-semibold text-slate-950">{hasFilters ? "Nenhum cadastro corresponde à busca." : "Sua base ainda está vazia."}</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{hasFilters ? "Tente buscar por outro nome ou contato." : "Cadastre seu primeiro aluno para começar a acompanhar sua base."}</p>{!hasFilters && <Button type="button" variant="secondary" className="mt-5" onClick={onCreate}><Plus className="size-4" />Cadastrar primeiro aluno</Button>}</div>;
}
