import { ArrowLeft, Cake, CalendarDays, Check, Coins, Pencil, Phone, Trash2, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StudentAvatar } from "../../components/student-avatar";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Drawer } from "../../components/ui/drawer";
import { Skeleton } from "../../components/ui/skeleton";
import { useDeleteStudent, useStudent } from "../../hooks/use-students";
import { cn, formatDate, formatDateOnly } from "../../lib/utils";
import { type Student } from "../../types/api";
import { StudentForm } from "./student-form";

export function StudentDetailPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const student = useStudent(id);
  if (student.isPending) return <StudentDetailSkeleton />;
  if (student.isError || !student.data) return <div className="space-y-5"><StudentBreadcrumb current="Aluno" /><Card><CardContent className="p-6"><p className="font-semibold">Aluno não encontrado.</p><p className="mt-1 text-sm text-muted-foreground">O cadastro pode ter sido removido ou você não tem acesso a ele.</p></CardContent></Card></div>;
  if (edit) return <StudentForm student={student.data} />;

  const currentStudent = student.data;
  const contact = currentStudent.phone || "Cadastro básico";
  return <div className="space-y-5"><StudentBreadcrumb current={currentStudent.name} />{currentStudent.observations && <Alert className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><div className="min-w-0"><p className="font-semibold">Observações</p><AlertDescription className="text-slate-600">{currentStudent.observations}</AlertDescription></div></Alert>}<Card className="overflow-hidden"><div className="relative flex flex-col gap-5 bg-sky-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex min-w-0 items-center gap-4 pr-20 sm:pr-0"><StudentAvatar name={currentStudent.name} size={56} /><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><h1 className="truncate text-3xl font-bold tracking-tight text-slate-950">{currentStudent.name}</h1><div className="absolute right-5 top-5 sm:static sm:shrink-0"><AttendanceBadge mode={currentStudent.attendanceMode} /></div></div><p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-sm text-slate-600"><Phone aria-hidden="true" className="size-3.5 shrink-0 text-sky-600" />{contact}</p></div></div><div className="grid w-full grid-cols-2 gap-3 sm:w-auto"><Button type="button" className="w-full sm:w-auto" onClick={() => setEditOpen(true)}><Pencil className="size-4" />Editar cadastro</Button><Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Excluir</Button></div></div><CardContent className="grid grid-cols-2 gap-4 border-t border-sky-100 p-4 sm:gap-x-6 sm:gap-y-6 sm:p-6"><InfoItem icon={Cake} label="Data de nascimento" value={formatDateOnly(currentStudent.birthDate)} /><InfoItem icon={CalendarDays} label="Data de início" value={formatDateOnly(currentStudent.startDate)} /></CardContent></Card><StudentStats credits={currentStudent.credits} /><StudentForm student={currentStudent} drawer open={editOpen} onClose={() => setEditOpen(false)} /><DeleteStudentDrawer student={currentStudent} open={deleteOpen} onClose={() => setDeleteOpen(false)} onDeleted={() => navigate("/students", { replace: true })} /></div>;
}

function StudentBreadcrumb({ current }: { current: string }) {
  return <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to="/students">Alunos</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{current}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>;
}

function StudentStats({ credits }: { credits: number }) {
  return <div className="grid grid-cols-3 gap-3"><StatCard icon={Coins} label="Créditos" value={credits} tone="amber" /><StatCard icon={Check} label="Check-ins" value={12} tone="emerald" /><StatCard icon={X} label="Faltas" value={2} tone="red" /></div>;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: "amber" | "emerald" | "red" }) {
  const styles = {
    amber: { card: "border-amber-200 bg-amber-50 text-amber-950", icon: "bg-amber-100 text-amber-700", label: "text-amber-900", value: "text-amber-950" },
    emerald: { card: "border-emerald-200 bg-emerald-50 text-emerald-950", icon: "bg-emerald-100 text-emerald-700", label: "text-emerald-900", value: "text-emerald-950" },
    red: { card: "border-red-200 bg-red-50 text-red-950", icon: "bg-red-100 text-red-700", label: "text-red-900", value: "text-red-950" },
  }[tone];
  return <Card className={cn("relative h-full min-w-0 overflow-hidden", styles.card)}><div className="relative z-10 flex h-full min-h-24 flex-col gap-1 p-3 sm:min-h-28 sm:p-4"><p className={cn("max-w-[72%] break-words text-xs font-semibold leading-4 sm:text-sm", styles.label)}>{label}</p><p className={cn("mt-1 text-3xl font-bold leading-none tracking-tight sm:text-4xl", styles.value)}>{value}</p></div><div aria-hidden="true" className={cn("pointer-events-none absolute -bottom-3 -right-3 grid size-16 place-items-center rounded-tl-2xl", styles.icon)}><Icon className="size-8" /></div></Card>;
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
  return <div className="space-y-5"><Skeleton className="h-6 w-36" /><Card className="overflow-hidden"><div className="p-5 sm:p-6"><div className="flex items-center gap-4"><Skeleton className="size-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-44" /><Skeleton className="h-3 w-32" /></div></div></div><CardContent className="grid gap-6 border-t border-sky-100 pt-5 sm:grid-cols-2 sm:p-6">{[1, 2].map((item) => <div key={item} className="flex items-start gap-3"><Skeleton className="size-9 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-36" /></div></div>)}</CardContent></Card><div className="grid grid-cols-3 gap-3">{[1, 2, 3].map((item) => <div key={item} className="relative min-h-24 overflow-hidden rounded-xl border border-border bg-card p-3 sm:min-h-28 sm:p-4"><Skeleton className="h-3 w-14" /><Skeleton className="mt-1 h-7 w-8" /><Skeleton className="absolute -bottom-3 -right-3 size-16 rounded-tl-2xl" /></div>)}</div></div>;
}

function AttendanceBadge({ mode }: { mode: Student["attendanceMode"] }) {
  const modeColor = mode === "online" ? "bg-emerald-50 text-emerald-700" : mode === "presencial" ? "bg-violet-50 text-violet-700" : "text-slate-500";
  return <Badge variant={mode ? "secondary" : "outline"} className={cn("w-fit", modeColor)}>{mode === "online" ? "Online" : mode === "presencial" ? "Presencial" : "Modalidade não informada"}</Badge>;
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return <div className="flex min-w-0 items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600"><Icon className="size-4" /></div><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{label}</p><div className="mt-1 break-words text-sm font-medium text-slate-950">{value}</div></div></div>;
}
