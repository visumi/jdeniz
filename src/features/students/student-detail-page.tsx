import { ArrowLeft, Cake, CalendarDays, Check, Coins, Dumbbell, FileText, Pencil, Phone, Plus, Trash2, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StudentAvatar } from "../../components/student-avatar";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Drawer } from "../../components/ui/drawer";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination";
import { Skeleton } from "../../components/ui/skeleton";
import { useDeleteStudent, useStudent } from "../../hooks/use-students";
import { useWorkouts } from "../../hooks/use-workouts";
import { cn, formatDate, formatDateCompact, formatDateOnly } from "../../lib/utils";
import { type Student, type Workout, type WorkoutDeadlineStatus, type WorkoutObjective } from "../../types/api";
import { StudentForm } from "./student-form";
import { WorkoutForm } from "../workouts/workout-form";

export function StudentDetailPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const student = useStudent(id);
  const workouts = useWorkouts(id);
  if (student.isPending) return <StudentDetailSkeleton />;
  if (student.isError || !student.data) return <div className="space-y-5"><StudentBreadcrumb current="Aluno" /><Card><CardContent className="p-6"><p className="font-semibold">Aluno não encontrado.</p><p className="mt-1 text-sm text-muted-foreground">O cadastro pode ter sido removido ou você não tem acesso a ele.</p></CardContent></Card></div>;
  if (edit) return <StudentForm student={student.data} />;

  const currentStudent = student.data;
  const contact = currentStudent.phone || "Cadastro básico";
  return <div className="space-y-5"><StudentBreadcrumb current={currentStudent.name} />{currentStudent.observations && <Alert className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><div className="min-w-0"><p className="font-semibold">Observações</p><AlertDescription className="text-slate-600">{currentStudent.observations}</AlertDescription></div></Alert>}<Card className="overflow-hidden"><div className="relative flex flex-col gap-5 bg-sky-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex min-w-0 items-center gap-4 pr-20 sm:pr-0"><StudentAvatar name={currentStudent.name} size={56} /><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><h1 className="truncate text-3xl font-bold tracking-tight text-slate-950">{currentStudent.name}</h1><div className="absolute right-5 top-5 sm:static sm:shrink-0"><AttendanceBadge mode={currentStudent.attendanceMode} /></div></div><p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-sm text-slate-600"><Phone aria-hidden="true" className="size-3.5 shrink-0 text-sky-600" />{contact}</p></div></div><div className="grid w-full grid-cols-2 gap-3 sm:w-auto"><Button type="button" className="w-full sm:w-auto" onClick={() => setEditOpen(true)}><Pencil className="size-4" />Editar cadastro</Button><Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Excluir</Button></div></div><CardContent className="grid grid-cols-2 gap-4 border-t border-sky-100 p-4 sm:gap-x-6 sm:gap-y-6 sm:p-6"><InfoItem icon={Cake} label="Data de nascimento" value={formatDateOnly(currentStudent.birthDate)} /><InfoItem icon={CalendarDays} label="Data de início" value={formatDateOnly(currentStudent.startDate)} /></CardContent></Card><StudentStats credits={currentStudent.credits} /><CurrentWorkoutSection workouts={workouts.data || []} isPending={workouts.isPending} isError={workouts.isError} onRetry={() => void workouts.refetch()} onCreate={() => setWorkoutOpen(true)} /><StudentForm student={currentStudent} drawer open={editOpen} onClose={() => setEditOpen(false)} /><WorkoutForm studentId={currentStudent.id} open={workoutOpen} onClose={() => setWorkoutOpen(false)} /><DeleteStudentDrawer student={currentStudent} open={deleteOpen} onClose={() => setDeleteOpen(false)} onDeleted={() => navigate("/students", { replace: true })} /></div>;
}

function StudentBreadcrumb({ current }: { current: string }) {
  return <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to="/students">Alunos</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{current}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>;
}

function StudentStats({ credits }: { credits: number }) {
  return <div className="grid grid-cols-3 gap-3"><StatCard icon={Coins} label="Créditos" value={credits} tone="amber" /><StatCard icon={Check} label="Check-ins" value={12} tone="emerald" /><StatCard icon={X} label="Faltas" value={2} tone="red" /></div>;
}

function CurrentWorkoutSection({ workouts, isPending, isError, onRetry, onCreate }: { workouts: Workout[]; isPending: boolean; isError: boolean; onRetry: () => void; onCreate: () => void }) {
  const activeWorkout = workouts.find((workout) => workout.active);
  const history = workouts.filter((workout) => !workout.active);
  const pageSize = 10;
  const pageCount = Math.ceil(history.length / pageSize);
  const [historyPage, setHistoryPage] = useState(1);
  const currentPage = Math.min(historyPage, Math.max(pageCount, 1));
  const pageWorkouts = history.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (historyPage > Math.max(pageCount, 1)) setHistoryPage(Math.max(pageCount, 1));
  }, [historyPage, pageCount]);

  return <section aria-labelledby="current-workout-title" className="space-y-3 border-t border-sky-100 pt-5"><div className="flex items-center justify-between gap-3"><h2 id="current-workout-title" className="text-xl font-bold tracking-tight text-slate-950">Treinos</h2><Button type="button" size="sm" onClick={onCreate}><Plus className="size-4" />Novo treino</Button></div>{isPending ? <WorkoutSkeleton /> : isError ? <Card><CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-semibold text-slate-950">Não foi possível carregar o treino.</p><p className="mt-1 text-sm text-slate-600">Verifique sua conexão e tente novamente.</p></div><Button type="button" variant="secondary" onClick={onRetry}>Tentar novamente</Button></CardContent></Card> : <>{activeWorkout ? <WorkoutSummary workout={activeWorkout} /> : <Card><CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600"><Dumbbell className="size-5" /></div><div><p className="font-semibold text-slate-950">Nenhum treino ativo</p><p className="mt-1 text-sm leading-6 text-slate-600">Crie o primeiro treino para iniciar o acompanhamento deste aluno.</p></div></CardContent></Card>}{history.length > 0 && <WorkoutHistory workouts={pageWorkouts} page={currentPage} pageCount={pageCount} onPageChange={setHistoryPage} />}</>}</section>;
}

function WorkoutHistory({ workouts, page, pageCount, onPageChange }: { workouts: Workout[]; page: number; pageCount: number; onPageChange: (page: number) => void }) {
  return <div className="-mt-1 mx-3 max-w-3xl space-y-3 sm:mx-6 lg:max-w-none"><div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 divide-y divide-slate-200">{workouts.map((workout) => <WorkoutHistoryRow key={workout.id} workout={workout} />)}</div>{pageCount > 1 && <HistoryPagination page={page} pageCount={pageCount} onPageChange={onPageChange} />}</div>;
}

function WorkoutHistoryRow({ workout }: { workout: Workout }) {
  return <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4"><div className="flex min-w-0 items-center gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-200 text-slate-500"><Dumbbell aria-hidden="true" className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{workout.name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{workout.frequencyPerWeek}x · {formatDateCompact(workout.startDate)} — {formatDateCompact(workout.endDate)}</p></div></div><Badge variant="outline" className="shrink-0 border-slate-300 bg-slate-50 text-slate-500">Inativo</Badge></div>;
}

function HistoryPagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  return <Pagination className="justify-end"><PaginationContent><PaginationItem><PaginationPrevious disabled={page === 1} onClick={() => onPageChange(page - 1)} /></PaginationItem>{getPaginationItems(page, pageCount).map((item, index) => <PaginationItem key={`${item}-${index}`}>{item === "ellipsis" ? <PaginationEllipsis /> : <PaginationLink isActive={item === page} aria-label={`Ir para a página ${item}`} onClick={() => onPageChange(item)}>{item}</PaginationLink>}</PaginationItem>)}<PaginationItem><PaginationNext disabled={page === pageCount} onClick={() => onPageChange(page + 1)} /></PaginationItem></PaginationContent></Pagination>;
}

function getPaginationItems(page: number, pageCount: number): Array<number | "ellipsis"> {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount));
  const items: Array<number | "ellipsis"> = [];
  let previous = 0;
  [...pages].sort((a, b) => a - b).forEach((value) => {
    if (value - previous > 1) items.push("ellipsis");
    items.push(value);
    previous = value;
  });
  return items;
}

function WorkoutSummary({ workout }: { workout: Workout }) {
  return <Card className="overflow-hidden border-sky-200"><div className="flex items-start justify-between gap-3 bg-sky-50/80 p-4 sm:p-5"><div className="flex min-w-0 items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500 text-white shadow-sm"><Dumbbell aria-hidden="true" className="size-5" /></div><div className="min-w-0"><p className="text-xs font-semibold text-sky-800">{getObjectiveLabel(workout.objective)}</p><p className="mt-0.5 break-words text-lg font-bold tracking-tight text-slate-950">{workout.name}</p></div></div><WorkoutDeadlineBadge status={workout.deadlineStatus} /></div><CardContent className="space-y-4 p-4 sm:p-5"><div className="grid grid-cols-3 gap-2 sm:gap-3"><WorkoutMetric icon={Dumbbell} label="Frequência" value={`${workout.frequencyPerWeek}x`} tone="sky" /><WorkoutMetric icon={CalendarDays} label="Início" value={formatDateCompact(workout.startDate)} tone="emerald" /><WorkoutMetric icon={CalendarDays} label="Fim" value={formatDateCompact(workout.endDate)} tone="amber" /></div>{workout.observations && <div className="flex items-start gap-3 border-t border-sky-100 pt-4"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><FileText aria-hidden="true" className="size-4" /></div><div className="min-w-0"><p className="text-xs font-semibold text-slate-500">Observações</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-700">{workout.observations}</p></div></div>}</CardContent></Card>;
}

function WorkoutMetric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: "amber" | "emerald" | "sky" }) {
  const styles = {
    amber: { background: "bg-amber-50", icon: "bg-amber-100 text-amber-700", label: "text-amber-900", value: "text-amber-950" },
    emerald: { background: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-700", label: "text-emerald-900", value: "text-emerald-950" },
    sky: { background: "bg-sky-50", icon: "bg-sky-100 text-sky-700", label: "text-sky-900", value: "text-sky-950" }
  }[tone];
  return <div className={cn("min-w-0 rounded-xl p-2.5 sm:p-3", styles.background)}><div className={cn("grid size-7 place-items-center rounded-lg", styles.icon)}><Icon aria-hidden="true" className="size-3.5" /></div><p className={cn("mt-2 text-[11px] font-semibold leading-4 sm:text-xs", styles.label)}>{label}</p><p className={cn("mt-1 whitespace-nowrap text-[13px] font-bold leading-4 sm:text-sm", styles.value)}>{value}</p></div>;
}

function WorkoutDeadlineBadge({ status }: { status: WorkoutDeadlineStatus }) {
  const styles: Record<WorkoutDeadlineStatus, { label: string; className: string }> = { on_track: { label: "Em dia", className: "bg-emerald-100 text-emerald-800" }, expiring_soon: { label: "Próximo do vencimento", className: "bg-amber-100 text-amber-900" }, expired: { label: "Vencido", className: "bg-red-100 text-red-800" } };
  const current = styles[status];
  return <Badge className={cn("shrink-0 whitespace-nowrap", current.className)}>{current.label}</Badge>;
}

function getObjectiveLabel(objective: WorkoutObjective): string {
  return { hipertrofia: "Hipertrofia", emagrecimento: "Emagrecimento", saude_longevidade: "Saúde e longevidade", performance: "Performance", lesao: "Lesão" }[objective];
}

function WorkoutSkeleton() {
  return <Card><CardContent className="space-y-5 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-6 w-36" /></div><Skeleton className="h-6 w-20 rounded-full" /></div><div className="grid grid-cols-2 gap-4 border-t border-sky-100 pt-4 sm:grid-cols-3"><div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-28" /></div><div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-24" /></div><div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-24" /></div></div></CardContent></Card>;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: "amber" | "emerald" | "red" }) {
  const styles = {
    amber: { card: "border-amber-200 bg-amber-50 text-amber-950", icon: "bg-amber-100 text-amber-700", label: "text-amber-900", value: "text-amber-950" },
    emerald: { card: "border-emerald-200 bg-emerald-50 text-emerald-950", icon: "bg-emerald-100 text-emerald-700", label: "text-emerald-900", value: "text-emerald-950" },
    red: { card: "border-red-200 bg-red-50 text-red-950", icon: "bg-red-100 text-red-700", label: "text-red-900", value: "text-red-950" },
  }[tone];
  return <Card className={cn("relative h-full min-w-0 overflow-hidden", styles.card)}><div className="relative z-10 flex h-full min-h-20 flex-col gap-1 p-3 sm:min-h-24 sm:p-4"><p className={cn("max-w-[72%] break-words text-xs font-semibold leading-4 sm:text-sm", styles.label)}>{label}</p><p className={cn("mt-1 text-3xl font-bold leading-none tracking-tight sm:text-4xl", styles.value)}>{value}</p></div><div aria-hidden="true" className={cn("pointer-events-none absolute -bottom-3 -right-3 grid size-16 place-items-center rounded-tl-2xl", styles.icon)}><Icon className="size-8" /></div></Card>;
}

function DeleteStudentDrawer({ student, open, onClose, onDeleted }: { student: Student; open: boolean; onClose: () => void; onDeleted: () => void }) {
  const mutation = useDeleteStudent(student.id);
  async function handleDelete() {
    try {
      await mutation.mutateAsync();
      onDeleted();
    } catch {
      // O erro é exibido no próprio drawer.
    }
  }

  return <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title="Excluir aluno" description={`Remover o cadastro de ${student.name} da sua base.`} footer={<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button><Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={mutation.isPending}><Trash2 className="size-4" />{mutation.isPending ? "Excluindo…" : "Excluir aluno"}</Button></div>}><div className="space-y-3 text-sm leading-6 text-slate-600"><p>Esta ação remove os dados do aluno e não pode ser desfeita.</p>{mutation.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">Não foi possível excluir o cadastro agora. Tente novamente.</p>}</div></Drawer>;
}

function StudentDetailSkeleton() {
  return <div className="space-y-5"><Skeleton className="h-6 w-36" /><Card className="overflow-hidden"><div className="p-5 sm:p-6"><div className="flex items-center gap-4"><Skeleton className="size-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-44" /><Skeleton className="h-3 w-32" /></div></div></div><CardContent className="grid gap-6 border-t border-sky-100 pt-5 sm:grid-cols-2 sm:p-6">{[1, 2].map((item) => <div key={item} className="flex items-start gap-3"><Skeleton className="size-9 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-36" /></div></div>)}</CardContent></Card><div className="grid grid-cols-3 gap-3">{[1, 2, 3].map((item) => <div key={item} className="relative min-h-20 overflow-hidden rounded-xl border border-border bg-card p-3 sm:min-h-24 sm:p-4"><Skeleton className="h-3 w-14" /><Skeleton className="mt-1 h-7 w-8" /><Skeleton className="absolute -bottom-3 -right-3 size-16 rounded-tl-2xl" /></div>)}</div></div>;
}

function AttendanceBadge({ mode }: { mode: Student["attendanceMode"] }) {
  const modeColor = mode === "online" ? "bg-emerald-50 text-emerald-700" : mode === "presencial" ? "bg-violet-50 text-violet-700" : "text-slate-500";
  return <Badge variant={mode ? "secondary" : "outline"} className={cn("w-fit", modeColor)}>{mode === "online" ? "Online" : mode === "presencial" ? "Presencial" : "Modalidade não informada"}</Badge>;
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return <div className="flex min-w-0 items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600"><Icon className="size-4" /></div><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-medium text-slate-950">{value}</div></div></div>;
}
