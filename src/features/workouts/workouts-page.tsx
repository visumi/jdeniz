import { AlertCircle, ArrowRight, CalendarDays, Check, Dumbbell, Plus, Save, Search, UserRound } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StudentAvatar } from "../../components/student-avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Drawer } from "../../components/ui/drawer";
import { Input } from "../../components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination";
import { Skeleton } from "../../components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { useWorkoutOverview } from "../../hooks/use-workouts";
import { cn, formatDateCompact } from "../../lib/utils";
import { type WorkoutObjective, type WorkoutOverviewRow, type WorkoutOverviewStatus } from "../../types/api";
import { WorkoutForm } from "./workout-form";

const statusOptions: Array<{ value: WorkoutOverviewStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "on_track", label: "Em dia" },
  { value: "expiring_soon", label: "Próximo do vencimento" },
  { value: "expired", label: "Vencido" },
  { value: "no_workout", label: "Sem treino" }
];

const statusChipStyles: Record<WorkoutOverviewStatus | "", { active: string; inactive: string }> = {
  "": { active: "border-sky-600 bg-sky-600 text-white", inactive: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800" },
  on_track: { active: "border-emerald-200 bg-emerald-100 text-emerald-800", inactive: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800" },
  expiring_soon: { active: "border-amber-200 bg-amber-100 text-amber-900", inactive: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900" },
  expired: { active: "border-red-200 bg-red-100 text-red-800", inactive: "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 hover:text-red-800" },
  no_workout: { active: "border-slate-300 bg-slate-100 text-slate-700", inactive: "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700" }
};

export function WorkoutsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const searchParam = searchParams.get("search") || "";
  const statusParam = isWorkoutOverviewStatus(searchParams.get("status") || "") ? searchParams.get("status") as WorkoutOverviewStatus : "";
  const [searchInput, setSearchInput] = useState(searchParam);
  const [wizardOpen, setWizardOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchInput.trim());
  const overview = useWorkoutOverview({ page, search: searchParam, status: statusParam });

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (deferredSearch === searchParam) return;
    const timer = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      if (deferredSearch) nextParams.set("search", deferredSearch);
      else nextParams.delete("search");
      nextParams.delete("page");
      setSearchParams(nextParams, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [deferredSearch, searchParam, searchParams, setSearchParams]);

  function updateListParams(next: { page?: number; status?: WorkoutOverviewStatus | "" }) {
    const nextParams = new URLSearchParams(searchParams);
    if (next.page && next.page > 1) nextParams.set("page", String(next.page));
    else nextParams.delete("page");
    if (next.status) nextParams.set("status", next.status);
    else if (next.status === "") nextParams.delete("status");
    setSearchParams(nextParams, { replace: true });
  }

  const items = overview.data?.items || [];
  const hasFilters = Boolean(searchParam || statusParam);

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Treinos</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">Acompanhe o treino ativo de cada aluno em um só lugar.</p>
      </div>
      <Button type="button" className="w-full sm:w-auto" onClick={() => setWizardOpen(true)}><Plus className="size-4" />Novo treino</Button>
    </div>

    <Card className="overflow-hidden">
      <CardHeader className="gap-4 border-b border-sky-100 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Visão geral dos alunos</CardTitle>
            <p className="mt-1 text-sm text-slate-600">{overview.isPending && !overview.data ? "Carregando treinos…" : `${overview.data?.total || 0} ${overview.data?.total === 1 ? "aluno" : "alunos"}`}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600" />
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar aluno por nome" className="border-sky-200 bg-white pl-9" aria-label="Buscar aluno por nome" />
          </div>
          <div className="px-1"><ToggleGroup aria-label="Filtrar treinos por status" value={statusParam} onValueChange={(value) => updateListParams({ page: 1, status: value as WorkoutOverviewStatus | "" })} className="w-full flex-wrap justify-start"><ToggleGroupItem value="" activeClassName={statusChipStyles[""].active} inactiveClassName={statusChipStyles[""].inactive}>{statusOptions[0].label}</ToggleGroupItem>{statusOptions.slice(1).map((option) => <ToggleGroupItem key={option.value} value={option.value} activeClassName={statusChipStyles[option.value].active} inactiveClassName={statusChipStyles[option.value].inactive}>{option.label}</ToggleGroupItem>)}</ToggleGroup></div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {overview.isPending && !overview.data ? <OverviewLoading /> : overview.isError ? <OverviewError onRetry={() => void overview.refetch()} /> : items.length === 0 ? <OverviewEmpty hasFilters={hasFilters} onClear={() => { setSearchInput(""); setSearchParams({}, { replace: true }); }} /> : <>
          <div className="w-full space-y-2 p-3 md:hidden">{items.map((item) => <MobileOverviewCard key={item.student.id} item={item} />)}</div>
          <DesktopOverviewTable items={items} onOpen={(studentId) => navigate(`/students/${studentId}`)} />
        </>}
      </CardContent>
    </Card>

    {/* Temporário para testes: manter a paginação visível mesmo com uma única página. */}
    {overview.data && <OverviewPagination page={overview.data.page} pageCount={overview.data.pageCount} onPageChange={(nextPage) => updateListParams({ page: nextPage })} />}
    <WorkoutCreationWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
  </div>;
}

function MobileOverviewCard({ item }: { item: WorkoutOverviewRow }) {
  return <Link to={`/students/${item.student.id}`} className="group block rounded-xl border border-sky-100 bg-white p-3 transition-[background-color,border-color] duration-200 hover:border-sky-200 hover:bg-sky-50 focus-visible:bg-sky-50">
    <div className="flex items-center gap-3">
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105"><StudentAvatar name={item.student.name} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2"><span className="min-w-0 truncate text-sm font-semibold text-slate-950">{item.student.name}</span><WorkoutStatusBadge status={item.status} /></span>
        {item.activeWorkout ? <><span className="mt-1 block truncate text-sm font-semibold text-slate-700">{item.activeWorkout.name}</span><span className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><Dumbbell aria-hidden="true" className="size-3.5 text-sky-600" />{getObjectiveLabel(item.activeWorkout.objective)} · {item.activeWorkout.frequencyPerWeek}x</span><span className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><CalendarDays aria-hidden="true" className="size-3.5 text-sky-600" />{formatDateCompact(item.activeWorkout.startDate)} — {formatDateCompact(item.activeWorkout.endDate)}</span></> : <span className="mt-1 block text-sm text-slate-600">Nenhum treino ativo</span>}
      </span>
    </div>
  </Link>;
}

function DesktopOverviewTable({ items, onOpen }: { items: WorkoutOverviewRow[]; onOpen: (studentId: string) => void }) {
  return <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-sky-100 bg-sky-50/60 text-xs font-semibold text-slate-600"><tr><th scope="col" className="px-5 py-3">Aluno</th><th scope="col" className="px-4 py-3">Treino ativo</th><th scope="col" className="px-4 py-3">Frequência</th><th scope="col" className="px-4 py-3">Período</th><th scope="col" className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-sky-100">{items.map((item) => <tr key={item.student.id} role="link" tabIndex={0} aria-label={`Abrir treinos de ${item.student.name}`} className="group cursor-pointer transition-colors duration-200 hover:bg-sky-50/60 focus-visible:bg-sky-50" onClick={() => onOpen(item.student.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(item.student.id); } }}><td className="px-5 py-4"><div className="flex min-w-44 items-center gap-3"><span className="transition-transform duration-200 group-hover:scale-105"><StudentAvatar name={item.student.name} /></span><span className="min-w-0"><span className="block truncate font-semibold text-slate-950">{item.student.name}</span><span className="block truncate text-xs text-slate-600">{item.student.phone || item.student.email || "Cadastro básico"}</span></span></div></td><td className="max-w-56 px-4 py-4"><span className="block truncate font-semibold text-slate-800">{item.activeWorkout?.name || "Nenhum treino ativo"}</span>{item.activeWorkout && <span className="mt-1 block truncate text-xs text-slate-600">{getObjectiveLabel(item.activeWorkout.objective)}</span>}</td><td className="px-4 py-4 text-slate-700">{item.activeWorkout ? `${item.activeWorkout.frequencyPerWeek}x por semana` : "—"}</td><td className="whitespace-nowrap px-4 py-4 text-slate-700">{item.activeWorkout ? `${formatDateCompact(item.activeWorkout.startDate)} — ${formatDateCompact(item.activeWorkout.endDate)}` : "—"}</td><td className="px-5 py-4"><WorkoutStatusBadge status={item.status} /></td></tr>)}</tbody></table></div>;
}

function WorkoutStatusBadge({ status }: { status: WorkoutOverviewStatus }) {
  const styles: Record<WorkoutOverviewStatus, { label: string; className: string }> = {
    on_track: { label: "Em dia", className: "bg-emerald-100 text-emerald-800" },
    expiring_soon: { label: "Próximo do vencimento", className: "bg-amber-100 text-amber-900" },
    expired: { label: "Vencido", className: "bg-red-100 text-red-800" },
    no_workout: { label: "Sem treino", className: "border-slate-300 bg-slate-50 text-slate-600" }
  };
  const current = styles[status];
  return <Badge variant={status === "no_workout" ? "outline" : "secondary"} className={cn("shrink-0 whitespace-nowrap", current.className)}>{current.label}</Badge>;
}

function WorkoutCreationWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WorkoutOverviewRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const searchQuery = search.trim();
  const results = useWorkoutOverview({ page: 1, search: searchQuery.length >= 2 ? searchQuery : "", status: "", enabled: open && step === 1 && searchQuery.length >= 2 });
  const visibleResults = results.data?.items.slice(0, 8) || [];

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSearch("");
      setSelected(null);
      setIsSaving(false);
    }
  }, [open]);

  function closeWizard() {
    setStep(1);
    setSearch("");
    setSelected(null);
    onClose();
  }

  function selectStudent(item: WorkoutOverviewRow) {
    setSelected(item);
    setStep(2);
  }

  const footer = step === 1
    ? <div className="w-full"><Button type="button" variant="secondary" className="w-full" onClick={closeWizard}>Cancelar</Button></div>
    : <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={closeWizard} disabled={isSaving}>Cancelar</Button><Button type="submit" form="workout-wizard-form" disabled={isSaving}><Save className="size-4" />{isSaving ? "Salvando…" : "Salvar treino"}</Button></div>;

  return <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeWizard(); }} title="Novo treino" description={step === 1 ? "Escolha o aluno que receberá o novo ciclo." : "Defina o próximo ciclo de acompanhamento do aluno."} footer={footer}>
    <div className="mb-6 flex items-start gap-2" aria-label={`Etapa ${step} de 2`}>
      <WizardStep number={1} label="Alunos" active={step === 1} complete={Boolean(selected) && step === 2} onClick={() => selected && setStep(1)} />
      <span aria-hidden="true" className={cn("mt-3 h-px flex-1", selected ? "bg-sky-300" : "bg-slate-200")} />
      <WizardStep number={2} label="Treinos" active={step === 2} complete={false} />
    </div>
    {step === 1 ? <div className="space-y-4"><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600" /><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pelo nome do aluno" className="pl-9" aria-label="Buscar pelo nome do aluno" /> </div>{searchQuery.length >= 2 && (results.isPending ? <WizardResultsLoading /> : results.isError ? <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm leading-5 text-red-800">Não foi possível buscar os alunos agora. Tente novamente.</div> : visibleResults.length === 0 ? <div className="rounded-lg bg-slate-50 p-4 text-sm leading-5 text-slate-600">Nenhum aluno encontrado com esse nome.</div> : <div className="space-y-2" role="listbox" aria-label="Resultados de alunos">{visibleResults.map((item) => <button key={item.student.id} type="button" className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl border border-sky-100 bg-white p-3 text-left transition-[background-color,border-color] duration-200 hover:border-sky-200 hover:bg-sky-50 focus-visible:bg-sky-50" onClick={() => selectStudent(item)}><StudentAvatar name={item.student.name} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{item.student.name}</span><span className="mt-1 block truncate text-xs text-slate-600">{item.activeWorkout ? `${item.activeWorkout.name} · ${getStatusLabel(item.status)}` : "Sem treino ativo"}</span></span><ArrowRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" /></button>)}</div>)}</div> : selected ? <div className="space-y-5"><div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3"><StudentAvatar name={selected.student.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-950">{selected.student.name}</p><p className="mt-1 text-xs text-slate-600">{selected.activeWorkout ? `Treino atual: ${selected.activeWorkout.name} · ${getStatusLabel(selected.status)}` : "Nenhum treino ativo"}</p></div><button type="button" className="cursor-pointer text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900" onClick={() => setStep(1)}>Trocar</button></div>{selected.activeWorkout && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950"><p className="font-semibold">Este aluno já possui um treino ativo.</p><p className="mt-1">Ao salvar, o treino atual será encerrado e ficará no histórico.</p></div>}<WorkoutForm studentId={selected.student.id} open={open && step === 2} onClose={closeWizard} embedded formId="workout-wizard-form" onPendingChange={setIsSaving} /></div> : null}
  </Drawer>;
}

function WizardStep({ number, label, active, complete, onClick }: { number: number; label: string; active: boolean; complete: boolean; onClick?: () => void }) {
  const StepIcon = number === 1 ? UserRound : Dumbbell;
  const content = <span aria-hidden="true" className={cn("grid size-7 place-items-center rounded-full", active ? "bg-sky-600 text-white" : complete ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500")}>{complete ? <Check aria-hidden="true" className="size-4" /> : <StepIcon aria-hidden="true" className="size-4" />}</span>;
  const labelContent = <span aria-hidden="true" className={cn("text-xs font-semibold", active || complete ? "text-sky-700" : "text-slate-500")}>{label}</span>;
  return onClick ? <button type="button" aria-label={`Voltar para a etapa ${number}: ${label}`} className="flex w-14 cursor-pointer flex-col items-center gap-1 rounded-md focus-visible:ring-2 focus-visible:ring-sky-500" onClick={onClick}>{content}{labelContent}</button> : <div aria-current={active ? "step" : undefined} aria-label={`Etapa ${number}: ${label}`} className="flex w-14 flex-col items-center gap-1">{content}{labelContent}</div>;
}

function OverviewPagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  return <Pagination className="justify-end"><PaginationContent><PaginationItem><PaginationPrevious disabled={page === 1} onClick={() => onPageChange(page - 1)} /></PaginationItem>{getPaginationItems(page, pageCount).map((item, index) => <PaginationItem key={`${item}-${index}`}>{item === "ellipsis" ? <PaginationEllipsis /> : <PaginationLink isActive={item === page} aria-label={`Ir para a página ${item}`} onClick={() => onPageChange(item)}>{item}</PaginationLink>}</PaginationItem>)}<PaginationItem><PaginationNext disabled={page === pageCount} onClick={() => onPageChange(page + 1)} /></PaginationItem></PaginationContent></Pagination>;
}

function getPaginationItems(page: number, pageCount: number): Array<number | "ellipsis"> {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount));
  const items: Array<number | "ellipsis"> = [];
  let previous = 0;
  [...pages].sort((a, b) => a - b).forEach((value) => { if (value - previous > 1) items.push("ellipsis"); items.push(value); previous = value; });
  return items;
}

function OverviewLoading() {
  return <div role="status" aria-label="Carregando treinos"><div className="space-y-2 p-3 md:hidden">{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-sky-100 p-3"><Skeleton className="size-10 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><div className="flex items-center justify-between gap-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-5 w-20 rounded-full" /></div><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-32" /></div></div>)}</div><div className="hidden md:block">{[1, 2, 3].map((item) => <div key={item} className="grid grid-cols-[minmax(0,1.3fr)_minmax(12rem,1fr)_minmax(8rem,0.7fr)_minmax(12rem,1fr)_minmax(8rem,0.7fr)] items-center gap-4 border-b border-sky-100 px-5 py-4"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-3 w-28" /></div><Skeleton className="h-3 w-36" /><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-28" /><Skeleton className="h-5 w-20 rounded-full" /></div>)}</div></div>;
}

function WizardResultsLoading() {
  return <div className="space-y-2" role="status" aria-label="Buscando alunos">{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-sky-100 p-3"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-40" /></div></div>)}</div>;
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
  return <div role="alert" className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center"><span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600"><AlertCircle className="size-5" /></span><div className="flex-1"><p className="font-semibold text-slate-950">Não foi possível carregar os treinos.</p><p className="mt-1 text-sm text-slate-600">Verifique sua conexão e tente novamente.</p></div><Button type="button" variant="secondary" onClick={onRetry}>Tentar novamente</Button></div>;
}

function OverviewEmpty({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return <div className="flex flex-col items-center px-5 py-14 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-600"><UserRound className="size-5" /></span><p className="mt-4 font-semibold text-slate-950">{hasFilters ? "Nenhum aluno corresponde aos filtros." : "Sua base ainda está vazia."}</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{hasFilters ? "Tente buscar outro nome ou remover o filtro de status." : "Cadastre um aluno para começar a acompanhar seus treinos."}</p>{hasFilters && <Button type="button" variant="secondary" className="mt-5" onClick={onClear}>Limpar filtros</Button>}</div>;
}

function getStatusLabel(status: WorkoutOverviewStatus): string {
  return { on_track: "Em dia", expiring_soon: "Próximo do vencimento", expired: "Vencido", no_workout: "Sem treino" }[status];
}

function getObjectiveLabel(objective: WorkoutObjective): string {
  return { hipertrofia: "Hipertrofia", emagrecimento: "Emagrecimento", saude_longevidade: "Saúde e longevidade", performance: "Performance", lesao: "Lesão" }[objective];
}

function isWorkoutOverviewStatus(value: string): value is WorkoutOverviewStatus {
  return value === "on_track" || value === "expiring_soon" || value === "expired" || value === "no_workout";
}
