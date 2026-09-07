import {
  AlertTriangle,
  CalendarCheck2,
  CalendarPlus,
  Cake,
  CheckCircle2,
  Dumbbell,
  Plus,
  UserX
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { StudentAvatar } from "../../components/student-avatar";
import { useAuth } from "../../hooks/use-auth";
import { useLessons } from "../../hooks/use-lessons";
import { useStudents } from "../../hooks/use-students";
import { useWorkoutOverview } from "../../hooks/use-workouts";
import { cn } from "../../lib/utils";
import { downloadBirthdayIcs, getBirthdayDateForYear } from "../../lib/calendar";
import { toDateValue } from "../../components/ui/calendar";
import { type Student, type WorkoutOverviewStatus } from "../../types/api";
import { toast } from "sonner";

const workoutStatusCards: Array<{
  status: WorkoutOverviewStatus;
  label: string;
  description: string;
  icon: typeof AlertTriangle;
  className: string;
  iconClassName: string;
  hoverClassName: string;
}> = [
  {
    status: "expired",
    label: "Vencidos",
    description: "Precisam de atenção",
    icon: AlertTriangle,
    className: "border-red-200 bg-red-50/80",
    iconClassName: "bg-red-100 text-red-700",
    hoverClassName: "hover:border-red-300 hover:bg-red-100/70 focus-visible:border-red-300 focus-visible:bg-red-100/70"
  },
  {
    status: "expiring_soon",
    label: "Próximos do vencimento",
    description: "Vencem em até 7 dias",
    icon: Cake,
    className: "border-amber-200 bg-amber-50/80",
    iconClassName: "bg-amber-100 text-amber-700",
    hoverClassName: "hover:border-amber-300 hover:bg-amber-100/70 focus-visible:border-amber-300 focus-visible:bg-amber-100/70"
  },
  {
    status: "on_track",
    label: "Em dia",
    description: "Acompanhamento ativo",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50/80",
    iconClassName: "bg-emerald-100 text-emerald-700",
    hoverClassName: "hover:border-emerald-300 hover:bg-emerald-100/70 focus-visible:border-emerald-300 focus-visible:bg-emerald-100/70"
  },
  {
    status: "no_workout",
    label: "Sem treino",
    description: "Ainda precisam de um ciclo",
    icon: UserX,
    className: "border-slate-200 bg-slate-50/90",
    iconClassName: "bg-slate-100 text-slate-600",
    hoverClassName: "hover:border-slate-300 hover:bg-slate-100/80 focus-visible:border-slate-300 focus-visible:bg-slate-100/80"
  }
];

export function DashboardPage() {
  const { user } = useAuth();
  const students = useStudents();
  const todayLessons = useLessons(toDateValue(new Date()));
  const firstName = user?.displayName?.trim().split(/\s+/)[0] || "professor";
  const currentMonth = new Date().getMonth() + 1;
  const birthdays = (students.data || [])
    .filter((student) => student.birthDate && Number(student.birthDate.slice(5, 7)) === currentMonth)
    .sort((a, b) => Number(a.birthDate!.slice(8, 10)) - Number(b.birthDate!.slice(8, 10)));
  const monthYearLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(new Date().getFullYear(), currentMonth - 1, 1));

  const expired = useWorkoutOverview({ page: 1, search: "", status: "expired" });
  const expiringSoon = useWorkoutOverview({ page: 1, search: "", status: "expiring_soon" });
  const onTrack = useWorkoutOverview({ page: 1, search: "", status: "on_track" });
  const noWorkout = useWorkoutOverview({ page: 1, search: "", status: "no_workout" });
  const workoutQueries = { expired, expiring_soon: expiringSoon, on_track: onTrack, no_workout: noWorkout };
  const isInitialLoading = students.isPending && Object.values(workoutQueries).every((query) => query.isPending);

  return <Card className="space-y-6 border-sky-100 bg-white p-4 sm:p-6 lg:p-6">
    {isInitialLoading ? <DashboardSkeleton /> : <>
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-sky-700">Olá, {firstName}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Seu painel de acompanhamento</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Veja o que merece atenção hoje e mantenha sua base sempre em movimento.</p>
      </div>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button asChild className="flex-1 sm:flex-none"><Link to="/students?new=1"><Plus className="size-4" />Novo aluno</Link></Button>
        <Button asChild variant="secondary" className="flex-1 sm:flex-none"><Link to="/workouts"><Dumbbell className="size-4" />Treinos</Link></Button>
      </div>
    </section>

    <TodayLessonsSection query={todayLessons} />
    <BirthdaySection birthdays={birthdays} monthYearLabel={monthYearLabel} isPending={students.isPending} isError={students.isError} />
    <WorkoutStatusSection queries={workoutQueries} />
    </>}
  </Card>;
}

function TodayLessonsSection({ query }: { query: ReturnType<typeof useLessons> }) {
  const lessonCount = query.data?.items.length ?? 0;

  return <section aria-labelledby="today-lessons-title" className="relative isolate overflow-hidden rounded-xl border border-sky-900/80 bg-sky-950 text-white">
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-sky-800/40 blur-3xl" />
    <div className="relative flex items-center gap-4 p-5 sm:p-6">
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-800/80 text-sky-100"><CalendarCheck2 className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <h2 id="today-lessons-title" className="text-sm font-semibold leading-5 text-sky-100">Agendamentos</h2>
        {query.isPending ? <TodayLessonsSkeleton /> : query.isError ? <p role="alert" className="mt-1 text-sm text-sky-100">Não foi possível carregar a programação.</p> : <p aria-live="polite" className="mt-1.5 flex items-baseline gap-1.5"><span className="text-4xl font-bold leading-none tracking-[-0.03em] text-white">{lessonCount}</span><span className="text-sm font-medium leading-5 text-sky-100">{lessonCount === 1 ? "aula hoje" : "aulas hoje"}</span></p>}
      </div>
      <Button asChild size="sm" className="shrink-0 bg-white text-sky-950 hover:bg-sky-50 focus-visible:ring-white"><Link to="/lessons"><CalendarCheck2 className="size-4" />Abrir check-in</Link></Button>
    </div>
  </section>;
}

function TodayLessonsSkeleton() {
  return <span role="status" aria-label="Carregando aulas de hoje" className="mt-2 block"><Skeleton className="h-8 w-24 bg-sky-800/80" /></span>;
}

function BirthdaySection({ birthdays, monthYearLabel, isPending, isError }: { birthdays: Student[]; monthYearLabel: string; isPending: boolean; isError: boolean }) {
  return <section aria-labelledby="birthdays-title" className="overflow-hidden rounded-xl border border-amber-200 bg-white">
    <div className="flex items-start gap-3 border-b border-amber-200/80 px-5 py-4 sm:px-6">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><Cake className="size-5" /></span>
      <div className="min-w-0">
        <h2 id="birthdays-title" className="leading-5 font-bold text-amber-950">Aniversariantes</h2>
        <p className="text-sm leading-5 text-amber-700">{monthYearLabel}</p>
      </div>
    </div>
    <div className="bg-white p-4 sm:p-5">
      {isPending ? <BirthdaySkeleton /> : isError ? <p role="alert" className="rounded-lg bg-white/70 p-3 text-sm text-amber-950">Não foi possível carregar os aniversariantes agora.</p> : birthdays.length === 0 ? <div className="rounded-lg bg-white/60 px-4 py-5 text-center"><p className="text-sm font-semibold text-amber-950">Nenhum aniversário neste mês.</p><p className="mt-1 text-xs leading-5 text-amber-900/70">Cadastre a data de nascimento dos alunos para acompanhar essas datas.</p></div> : <div className="grid gap-2 sm:grid-cols-2">{birthdays.map((student) => <BirthdayRow key={student.id} student={student} />)}</div>}
    </div>
  </section>;
}

function BirthdayRow({ student }: { student: Student }) {
  const currentYear = new Date().getFullYear();
  const birthdayDate = student.birthDate ? getBirthdayDateForYear(student.birthDate, currentYear) : null;
  const isUnavailable = !birthdayDate;

  function handleAddToCalendar() {
    if (isUnavailable) {
      toast.error("O aniversário em 29/02 não pode ser criado no calendário deste ano.", { description: "Crie este evento manualmente no calendário." });
      return;
    }

    downloadBirthdayIcs({ studentId: student.id, name: student.name, birthDate: student.birthDate!, year: currentYear });
    toast.success("Evento de aniversário preparado para o calendário.");
  }

  return <div style={{ gridTemplateColumns: "minmax(0, 1fr) 3rem" }} className="group grid overflow-hidden rounded-lg border border-amber-100/80 bg-white/60 transition-[background-color,border-color] duration-200 hover:border-sky-200 hover:bg-sky-50/40 focus-within:border-sky-300">
    <Link to={`/students/${student.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-l-lg px-3 py-2.5 transition-colors duration-200 hover:bg-sky-50/70 focus-visible:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset"><StudentAvatar name={student.name} size={32} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{student.name}</span><span className="mt-0.5 block text-xs text-slate-600">{formatBirthday(student.birthDate!)}</span></span></Link>
    <button type="button" disabled={isUnavailable} title={isUnavailable ? "Data indisponível neste ano. Crie o evento manualmente." : `Adicionar aniversário de ${student.name} ao calendário`} aria-label={isUnavailable ? `Adicionar aniversário de ${student.name} ao calendário indisponível neste ano` : `Adicionar aniversário de ${student.name} ao calendário`} onClick={handleAddToCalendar} className="flex h-full w-full cursor-pointer items-center justify-center rounded-none border-0 border-l border-sky-100 bg-sky-50 text-sky-600 transition-colors duration-200 hover:bg-sky-100 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-40"><CalendarPlus aria-hidden="true" className="size-4" /></button>
  </div>;
}

function WorkoutStatusSection({ queries }: { queries: Record<WorkoutOverviewStatus, ReturnType<typeof useWorkoutOverview>> }) {
  const hasError = workoutStatusCards.some(({ status }) => queries[status].isError);
  return <section aria-labelledby="workout-status-title" className="space-y-3">
    <div aria-hidden="true" className="h-px bg-sky-100" />
    <div>
      <h2 id="workout-status-title" className="text-xl font-bold tracking-tight text-slate-950">O que precisa da sua atenção?</h2>
      <p className="mt-1 text-sm leading-5 text-slate-600">Acesse cada grupo direto pela lista de treinos.</p>
    </div>
    <Card className="overflow-hidden">
      <CardContent className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">{workoutStatusCards.map((card) => <WorkoutStatusCard key={card.status} card={card} query={queries[card.status]} />)}</CardContent>
      {hasError && <p role="alert" className="border-t border-border/70 px-5 py-3 text-xs text-red-700">Alguns status não puderam ser atualizados. Tente novamente em Treinos.</p>}
    </Card>
  </section>;
}

function WorkoutStatusCard({ card, query }: { card: typeof workoutStatusCards[number]; query: ReturnType<typeof useWorkoutOverview> }) {
  const Icon = card.icon;
  const count = query.data?.total;
  if (query.isPending) return <div aria-hidden="true" className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3"><Skeleton className="size-8 shrink-0 rounded-lg" /><span className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-36" /></span><Skeleton className="h-7 w-6" /></div>;
  return <Link to={`/workouts?status=${card.status}`} className={cn("group flex min-h-20 items-center gap-3 rounded-lg border p-3 transition-[border-color,background-color] duration-200", card.className, card.hoverClassName)}>
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", card.iconClassName)}><Icon aria-hidden="true" className="size-4" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-950">{card.label}</span><span className="mt-0 block text-xs leading-4 text-slate-600">{card.description}</span></span>
    <span className="shrink-0 self-center text-2xl font-bold leading-none tracking-tight text-slate-950">{query.isPending ? "—" : count ?? 0}</span>
  </Link>;
}

function BirthdaySkeleton() {
  return <div className="grid gap-2 sm:grid-cols-2" role="status" aria-label="Carregando aniversariantes">{[1, 2].map((item) => <div key={item} className="flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2.5"><Skeleton className="size-8 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-20" /></div></div>)}</div>;
}

function DashboardSkeleton() {
  return <div className="space-y-6" role="status" aria-label="Carregando painel">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-72 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
      <div className="flex w-full gap-2 sm:w-auto"><Skeleton className="h-11 flex-1 rounded-lg sm:w-32 sm:flex-none" /><Skeleton className="h-11 flex-1 rounded-lg sm:w-28 sm:flex-none" /></div>
    </section>
    <section className="overflow-hidden rounded-xl border border-sky-900/80 bg-sky-950"><div className="flex items-center gap-4 p-5 sm:p-6"><Skeleton className="size-11 shrink-0 rounded-xl bg-sky-800/80" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-24 bg-sky-800/80" /><Skeleton className="h-8 w-20 bg-sky-800/80" /></div><Skeleton className="h-9 w-32 rounded-md bg-white/80" /></div></section>
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white">
      <div className="flex items-start gap-3 border-b border-amber-200/80 px-5 py-4 sm:px-6"><Skeleton className="size-10 shrink-0 rounded-xl" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-28" /></div></div>
      <div className="bg-white p-4 sm:p-5"><BirthdaySkeleton /></div>
    </section>
    <section className="space-y-3">
      <div aria-hidden="true" className="h-px bg-sky-100" />
      <div className="space-y-2"><Skeleton className="h-6 w-64 max-w-full" /><Skeleton className="h-4 w-72 max-w-full" /></div>
      <Card className="overflow-hidden"><CardContent className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">{[1, 2, 3, 4].map((item) => <div key={item} aria-hidden="true" className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3"><Skeleton className="size-8 shrink-0 rounded-lg" /><span className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-36" /></span><Skeleton className="h-7 w-6" /></div>)}</CardContent></Card>
    </section>
  </div>;
}

function formatBirthday(value: string): string {
  const [, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(new Date(2024, month - 1, day));
}
