import { Cake, CalendarDays, Mail, Phone, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StudentAvatar } from "../../components/student-avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ContentState } from "../../components/ui/content-state";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { useStudents } from "../../hooks/use-students";
import { cn, formatDateCompact, formatDateOnly } from "../../lib/utils";
import { type Student } from "../../types/api";
import { StudentForm } from "./student-form";
import { Badge } from "../../components/ui/badge";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination";

export function StudentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (searchParams.has("new")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("new");
      setSearchParams(nextParams, { replace: true });
    }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Alunos</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">Gerencie sua base de alunos em um só lugar.</p>
      </div>
      <Button type="button" className="w-full sm:w-auto" onClick={() => setDrawerOpen(true)}><Plus className="size-4" />Adicionar aluno</Button>
    </div>

    <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-sky-100 bg-white p-4 sm:p-5"><div><CardTitle>Cadastros de alunos</CardTitle><p className="mt-1 text-sm text-slate-600">{students.isPending ? "Carregando cadastros…" : `${filteredStudents.length} ${filteredStudents.length === 1 ? "cadastro encontrado" : "cadastros encontrados"}`}</p></div><div className="relative w-full"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou contato" className="border-sky-200 bg-white pl-9" aria-label="Filtrar cadastros de alunos" /></div></CardHeader><CardContent className="p-0">{students.isPending ? <LoadingState /> : students.isError ? <ErrorState onRetry={() => void students.refetch()} /> : filteredStudents.length === 0 ? <EmptyState hasFilters={Boolean(search)} onCreate={() => setDrawerOpen(true)} /> : <><MobileStudentList students={visibleStudents} /><DesktopStudentTable students={visibleStudents} /></>}</CardContent></Card>
    {/* Temporário para testes: manter a paginação visível mesmo com uma única página. */}
    {!students.isPending && !students.isError && <StudentsPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />}
    <StudentForm drawer open={drawerOpen} onClose={closeDrawer} />
  </div>;
}

function MobileStudentList({ students }: { students: Student[] }) {
  return <div className="space-y-2 p-3 md:hidden">{students.map((student) => <Link key={student.id} to={`/students/${student.id}`} className="group/student-card block rounded-xl border border-sky-100 bg-white p-3 transition-[background-color,border-color] duration-200 hover:border-sky-200 hover:bg-sky-50 focus-visible:bg-sky-50"><div className="flex items-center gap-3"><span className="shrink-0 transition-transform duration-200 group-hover/student-card:scale-105"><StudentAvatar name={student.name} /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="min-w-0 truncate text-sm font-semibold text-slate-950">{student.name}</span><AttendanceBadge mode={student.attendanceMode} className="shrink-0" /></span><span className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-600">{student.phone ? <><Phone aria-hidden="true" className="size-3.5 shrink-0 text-sky-600" /><span className="truncate">{student.phone}</span></> : student.email ? <><Mail aria-hidden="true" className="size-3.5 shrink-0 text-sky-600" /><span className="truncate">{student.email}</span></> : <span className="text-slate-400">Contato não informado</span>}</span><span className="mt-2 flex items-center gap-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5" title="Data de nascimento"><Cake aria-hidden="true" className="size-3.5 text-sky-600" /><span className="sr-only">Data de nascimento: </span>{formatDateCompact(student.birthDate)}</span><span className="inline-flex items-center gap-1.5" title="Data de início"><CalendarDays aria-hidden="true" className="size-3.5 text-sky-600" /><span className="sr-only">Data de início: </span>{formatDateCompact(student.startDate)}</span></span></span></div>{student.observations && <span className="sr-only">Observações: {student.observations}</span>}</Link>)}</div>;
}

function DesktopStudentTable({ students }: { students: Student[] }) {
  const navigate = useNavigate();
  return <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-sky-100 bg-sky-50/60 text-xs font-semibold text-slate-600"><tr><th scope="col" className="px-5 py-3">Aluno</th><th scope="col" className="px-4 py-3">Modalidade</th><th scope="col" className="px-4 py-3">Nascimento</th><th scope="col" className="px-5 py-3">Início</th></tr></thead><tbody className="divide-y divide-sky-100">{students.map((student) => <tr key={student.id} role="link" tabIndex={0} aria-label={`Abrir cadastro de ${student.name}`} className="group/student-row cursor-pointer transition-colors duration-200 hover:bg-sky-50/60 focus-visible:bg-sky-50" onClick={() => navigate(`/students/${student.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/students/${student.id}`); } }}><td className="px-5 py-4"><div className="flex min-w-44 items-center gap-3"><span className="transition-transform duration-200 group-hover/student-row:scale-105"><StudentAvatar name={student.name} /></span><span className="min-w-0"><span className="block truncate font-semibold text-slate-950">{student.name}</span><span className="block truncate text-xs text-slate-600">{student.email || student.phone || "Cadastro básico"}</span></span></div></td><td className="px-4 py-4"><AttendanceBadge mode={student.attendanceMode} /></td><td className="px-4 py-4 text-slate-700">{formatDateOnly(student.birthDate)}</td><td className="px-5 py-4 text-slate-700">{formatDateOnly(student.startDate)}</td></tr>)}</tbody></table></div>;
}

function AttendanceBadge({ mode, className }: { mode: Student["attendanceMode"]; className?: string }) {
  const modeColor = mode === "online" ? "bg-emerald-50 text-emerald-700" : mode === "presencial" ? "bg-violet-50 text-violet-700" : "text-slate-500";
  return <Badge variant={mode ? "secondary" : "outline"} className={cn("w-fit", modeColor, className)}>{mode === "online" ? "Online" : mode === "presencial" ? "Presencial" : "Modalidade não informada"}</Badge>;
}

function StudentsPagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  return <Pagination className="justify-end"><PaginationContent><PaginationItem><PaginationPrevious disabled={page === 1} onClick={() => onPageChange(page - 1)} /></PaginationItem>{getPaginationItems(page, pageCount).map((item, index) => <PaginationItem key={`${item}-${index}`}>{item === "ellipsis" ? <PaginationEllipsis /> : <PaginationLink isActive={item === page} aria-label={`Ir para a página ${item}`} onClick={() => onPageChange(item)}>{item}</PaginationLink>}</PaginationItem>)}<PaginationItem><PaginationNext disabled={page === pageCount} onClick={() => onPageChange(page + 1)} /></PaginationItem></PaginationContent></Pagination>;
}

function getPaginationItems(page: number, pageCount: number): Array<number | "ellipsis"> {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount));
  const items: Array<number | "ellipsis"> = [];
  [...pages].sort((a, b) => a - b).forEach((value) => {
    const previous = items[items.length - 1];
    if (typeof previous === "number" && value - previous > 1) items.push("ellipsis");
    items.push(value);
  });
  return items;
}

function LoadingState() {
  return <div role="status" aria-label="Carregando cadastros"><div className="space-y-2 p-3 md:hidden">{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-sky-100 p-3"><Skeleton className="size-10 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><div className="flex items-center justify-between gap-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-16 rounded-full" /></div><Skeleton className="h-2.5 w-32" /><div className="flex gap-3"><Skeleton className="h-2.5 w-16" /><Skeleton className="h-2.5 w-16" /></div></div></div>)}</div><div className="hidden md:block">{[1, 2, 3].map((item) => <div key={item} className="grid grid-cols-[minmax(0,1.7fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)] items-center gap-4 border-b border-sky-100 px-5 py-4 last:border-b-0"><div className="flex min-w-0 items-center gap-3"><Skeleton className="size-10 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-36" /></div></div><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-24" /></div>)}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <ContentState tone="error" title="Não foi possível carregar os alunos." description="Verifique sua conexão e tente novamente." action={<Button type="button" variant="secondary" onClick={onRetry}>Tentar novamente</Button>} />;
}

function EmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return <ContentState title={hasFilters ? "Nenhum cadastro corresponde à busca." : "Sua base ainda está vazia."} description={hasFilters ? "Tente buscar por outro nome ou contato." : "Cadastre seu primeiro aluno para começar a acompanhar sua base."} action={!hasFilters ? <Button type="button" variant="secondary" onClick={onCreate}><Plus className="size-4" />Cadastrar primeiro aluno</Button> : undefined} />;
}
