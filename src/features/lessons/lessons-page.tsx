import { CalendarCheck2, Check, ChevronLeft, ChevronRight, Clock3, Coins, Plus, Repeat, RotateCcw, X } from "lucide-react";
import { Fragment, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StudentAvatar } from "../../components/student-avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ContentState } from "../../components/ui/content-state";
import { DatePicker } from "../../components/ui/date-picker";
import { Drawer } from "../../components/ui/drawer";
import { Skeleton } from "../../components/ui/skeleton";
import { useLessons, useUpdateLessonStatus } from "../../hooks/use-lessons";
import { ApiError } from "../../lib/api";
import { cn, formatDateOnly } from "../../lib/utils";
import { toDateValue, parseDateValue } from "../../components/ui/calendar";
import { type Lesson, type LessonStatus } from "../../types/api";
import { LessonForm } from "./lesson-form";
import { toast } from "sonner";

export function LessonsPage() {
  const today = toDateValue(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = searchParams.get("date") || today;
  const selectedDate = isValidDate(requestedDate) ? requestedDate : today;
  const [formOpen, setFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [statusLesson, setStatusLesson] = useState<Lesson | null>(null);
  const lessons = useLessons(selectedDate);
  const updateStatus = useUpdateLessonStatus();
  const apiToday = lessons.data?.today || today;
  const items = lessons.data?.items || [];
  const displayItems = sortLessonsForDisplay(items);
  const lunchDividerIndex = displayItems.findIndex((lesson, index) => index > 0 && lesson.startTime >= "12:00" && displayItems[index - 1].startTime < "12:00");
  const isSwitchingDate = lessons.isFetching && lessons.isPlaceholderData;

  function setDate(nextDate: string) {
    if (nextDate === today) setSearchParams({}, { replace: true });
    else setSearchParams({ date: nextDate }, { replace: true });
  }

  function shiftDate(amount: number) {
    const date = parseDateValue(selectedDate) || new Date();
    date.setDate(date.getDate() + amount);
    setDate(toDateValue(date));
  }

  function openCreate() {
    setEditingLesson(null);
    setFormOpen(true);
  }

  function openEdit(lesson: Lesson) {
    setEditingLesson(lesson);
    setFormOpen(true);
  }

  async function handleStatus(lesson: Lesson, status: Exclude<LessonStatus, "scheduled">) {
    try {
      await updateStatus.mutateAsync({ id: lesson.id, input: { status } });
      setStatusLesson(null);
      toast.success(statusMessage(status));
    } catch (error) {
      toast.error(statusErrorMessage(error));
    }
  }

  const isToday = selectedDate === apiToday;
  const isPast = selectedDate < apiToday;

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Aulas</h1><p className="mt-1 text-sm leading-6 text-slate-600">Acompanhe os horários e registre o status de cada aula.</p></div>
      <Button type="button" className="w-full sm:w-auto" onClick={openCreate}><Plus className="size-4" />Nova aula</Button>
    </section>

    <Card className="overflow-hidden border-sky-100">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2"><Button type="button" variant="secondary" size="icon" aria-label="Dia anterior" onClick={() => shiftDate(-1)}><ChevronLeft className="size-4" /></Button><div className="min-w-0 flex-1 text-center"><DatePicker aria-label="Escolher dia da agenda" value={selectedDate} onChange={setDate} panelAlign="center" className="mx-auto h-auto w-fit max-w-full justify-center rounded-lg border-0 bg-transparent px-2 py-1 text-center text-base font-bold capitalize text-slate-950 transition-colors duration-200 hover:bg-sky-50 hover:text-sky-900 focus-visible:border-transparent focus-visible:bg-sky-50 focus-visible:ring-2" ><span className="truncate">{formatSelectedDate(selectedDate, apiToday)}</span></DatePicker><Badge variant="outline" className="mt-1 border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">{items.length} {items.length === 1 ? "aula" : "aulas"}</Badge></div><Button type="button" variant="secondary" size="icon" aria-label="Próximo dia" onClick={() => shiftDate(1)}><ChevronRight className="size-4" /></Button></div>
        {!isToday && <div><Button type="button" variant="ghost" className="w-full rounded-lg bg-sky-50/70 hover:bg-sky-100" onClick={() => setDate(apiToday)}><RotateCcw className="size-4" />Hoje</Button></div>}
      </CardContent>
    </Card>

    {lessons.isPending && !lessons.data || isSwitchingDate ? <LessonsLoading /> : lessons.isError ? <Card><CardContent className="p-0"><ContentState tone="error" title="Não foi possível carregar as aulas." description="Verifique sua conexão e tente novamente." action={<Button type="button" variant="secondary" onClick={() => void lessons.refetch()}>Tentar novamente</Button>} /></CardContent></Card> : items.length === 0 ? <EmptyLessons date={selectedDate} onCreate={openCreate} /> : <section aria-labelledby="lesson-list-title" className="space-y-3"><div><h2 id="lesson-list-title" className="text-xl font-bold tracking-tight text-slate-950">Programação</h2></div><div className="space-y-3">{displayItems.map((lesson, index) => <Fragment key={lesson.id}>{index === lunchDividerIndex && <div aria-hidden="true" className="flex items-center gap-3 py-1"><span className="h-0 flex-1 border-t-2 border-dashed border-red-500" style={{ borderTopColor: "#ef4444" }} /><span className="shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">12h</span><span className="h-0 flex-1 border-t-2 border-dashed border-red-500" style={{ borderTopColor: "#ef4444" }} /></div>}<LessonCard lesson={lesson} isToday={isToday} isPast={isPast} onEdit={() => openEdit(lesson)} onOpenStatus={() => setStatusLesson(lesson)} isStatusPending={updateStatus.isPending && updateStatus.variables?.id === lesson.id} /></Fragment>)}</div></section>}

    <LessonForm open={formOpen} onClose={() => { setFormOpen(false); setEditingLesson(null); }} defaultDate={selectedDate >= apiToday ? selectedDate : apiToday} lesson={editingLesson} />
    <LessonStatusDrawer lesson={statusLesson} open={Boolean(statusLesson)} onClose={() => setStatusLesson(null)} onStatus={(status) => { if (statusLesson) void handleStatus(statusLesson, status); }} isPending={updateStatus.isPending} />
  </div>;
}

function LessonCard({ lesson, isToday, isPast, onEdit, onOpenStatus, isStatusPending }: { lesson: Lesson; isToday: boolean; isPast: boolean; onEdit: () => void; onOpenStatus: () => void; isStatusPending: boolean }) {
  const [correcting, setCorrecting] = useState(false);
  const canEdit = lesson.status === "scheduled";
  const showStatusActions = isToday && lesson.status === "scheduled" || isPast && correcting;
  const isCompleted = lesson.status !== "scheduled";

  return <Card className={cn(lesson.status === "scheduled" ? "border-sky-200" : "border-slate-200", lesson.status !== "scheduled" && "grayscale opacity-75 transition-[filter,opacity] duration-200")}>
    <CardContent className="space-y-4 p-4 sm:p-5">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/students/${lesson.student.id}`} aria-label={`Abrir cadastro de ${lesson.student.name}`} className="group/student -m-2 flex min-w-0 cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors duration-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40">
            <StudentAvatar name={lesson.student.name} size={32} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2"><p className="min-w-0 truncate text-sm font-semibold text-slate-950 transition-colors duration-200 group-hover/student:text-sky-900">{lesson.student.name}</p>{lesson.isMakeup && <Badge variant="outline" className="shrink-0 gap-1.5 border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-900"><Repeat aria-hidden="true" className="size-3.5" />Reposição</Badge>}</div>
              <p className="mt-0.5 truncate text-xs text-slate-600">{lesson.student.activeWorkoutName || "Nenhum treino encontrado"}</p>
            </div>
          </Link>
          <div className="-mr-2 -mt-2 flex shrink-0 flex-col items-end gap-2">
          {canEdit ? <button type="button" aria-label={`Editar aula de ${lesson.student.name}`} className="min-w-16 cursor-pointer rounded-lg bg-sky-50 p-2 text-center transition-colors duration-200 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" onClick={onEdit}>
            <p className="text-sm font-bold leading-5 text-sky-900">{lesson.startTime}</p>
            <p className="text-[11px] text-sky-700">até {lesson.endTime}</p>
          </button> : <div className="min-w-16 rounded-lg bg-sky-50 p-2 text-center">
            <p className="text-sm font-bold leading-5 text-sky-900">{lesson.startTime}</p>
            <p className="text-[11px] text-sky-700">até {lesson.endTime}</p>
          </div>}
          </div>
        </div>
        <div className="-mx-2 mt-4"><LessonStatusBadge status={lesson.status} className="w-full justify-center" /></div>
      </div>
      {showStatusActions ? <div className="border-t border-sky-100 pt-3"><Button type="button" size="sm" className="w-full" disabled={isStatusPending} onClick={onOpenStatus}><CalendarCheck2 className="size-4" />Check-in</Button></div> : isPast ? <div className="flex justify-end border-t border-slate-100 pt-3"><Button type="button" variant="ghost" size="sm" onClick={() => setCorrecting(true)}>{isCompleted ? "Corrigir status" : "Registrar status"}</Button></div> : null}
    </CardContent>
  </Card>;
}

function LessonStatusDrawer({ lesson, open, onClose, onStatus, isPending }: { lesson: Lesson | null; open: boolean; onClose: () => void; onStatus: (status: Exclude<LessonStatus, "scheduled">) => void; isPending: boolean }) {
  if (!lesson) return null;

  const options = ([
    { status: "completed", label: "Check-in", description: "Registrar a presença do aluno.", icon: Check, className: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100", iconClassName: "bg-emerald-100 text-emerald-700" },
    { status: "absent", label: "Falta", description: "Registrar que o aluno não compareceu.", icon: X, className: "border-red-200 bg-red-50 hover:bg-red-100", iconClassName: "bg-red-100 text-red-700" },
    { status: "makeup", label: "Repor", description: "Registrar a reposição e gerar um crédito.", icon: Coins, className: "border-amber-200 bg-amber-50 hover:bg-amber-100", iconClassName: "bg-amber-100 text-amber-700" }
  ] as const).filter(({ status }) => !(lesson.isMakeup && status === "makeup"));

  return <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title="Registrar aula" description={`${lesson.student.name} · ${lesson.startTime} até ${lesson.endTime}`} footer={<Button type="button" variant="secondary" className="w-full" onClick={onClose} disabled={isPending}>Cancelar</Button>}>
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map(({ status, label, description, icon: Icon, className, iconClassName }) => <button key={status} type="button" className={cn("flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60", className)} disabled={isPending} onClick={() => onStatus(status)}><span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", iconClassName)}><Icon aria-hidden="true" className="size-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-slate-950">{label}</span><span className="mt-0.5 block text-xs text-slate-600">{description}</span></span></button>)}
      </div>
    </div>
  </Drawer>;
}

function LessonStatusBadge({ status, className }: { status: LessonStatus; className?: string }) {
  const styles: Record<LessonStatus, { label: string; className: string }> = {
    scheduled: { label: "Agendada", className: "border-sky-200 bg-sky-50 text-sky-800" },
    completed: { label: "Aula feita", className: "bg-emerald-100 text-emerald-800" },
    absent: { label: "Falta", className: "bg-red-100 text-red-800" },
    makeup: { label: "Reposição", className: "bg-amber-100 text-amber-900" }
  };
  return <Badge variant={status === "scheduled" ? "outline" : "secondary"} className={cn(styles[status].className, className)}>{styles[status].label}</Badge>;
}

function EmptyLessons({ date, onCreate }: { date: string; onCreate: () => void }) {
  return <Card><CardContent className="p-0"><ContentState icon={Clock3} title={`Nenhuma aula em ${formatDateOnly(date)}`} description="Agende uma aula para acompanhar o horário e registrar o status do atendimento." action={<Button type="button" onClick={onCreate}><Plus className="size-4" />Agendar aula</Button>} /></CardContent></Card>;
}

function LessonsLoading() {
  return <div role="status" aria-label="Carregando aulas" className="space-y-3">{[1, 2, 3].map((item) => <Card key={item}><CardContent className="flex items-center gap-3 p-4"><Skeleton className="h-14 w-16 rounded-lg" /><Skeleton className="size-8 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-44" /></div><Skeleton className="h-8 w-8 rounded-md" /></CardContent></Card>)}</div>;
}

function sortLessonsForDisplay(items: Lesson[]): Lesson[] {
  return [...items].sort((left, right) => {
    const completedOrder = Number(left.status !== "scheduled") - Number(right.status !== "scheduled");
    return completedOrder || left.startTime.localeCompare(right.startTime) || left.endTime.localeCompare(right.endTime);
  });
}

function formatSelectedDate(value: string, today: string): string {
  if (value === today) return "Hoje";
  const date = parseDateValue(value);
  return date ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(date) : value;
}

function isValidDate(value: string): boolean {
  return Boolean(parseDateValue(value));
}

function statusMessage(status: Exclude<LessonStatus, "scheduled">): string {
  return { completed: "Check-in registrado.", absent: "Falta registrada.", makeup: "Crédito de reposição adicionado." }[status];
}

function statusErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Não foi possível atualizar o status da aula.";
  return { lesson_in_future: "Aulas futuras só podem ser editadas.", insufficient_credits_for_status_correction: "Não há crédito disponível para desfazer esta reposição." }[error.code] || "Não foi possível atualizar o status da aula.";
}
