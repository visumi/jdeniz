import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, Coins, Repeat, Save, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StudentAvatar } from "../../components/student-avatar";
import { Button } from "../../components/ui/button";
import { DatePicker } from "../../components/ui/date-picker";
import { Drawer } from "../../components/ui/drawer";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useCreateLesson, useUpdateLesson } from "../../hooks/use-lessons";
import { useStudents } from "../../hooks/use-students";
import { ApiError } from "../../lib/api";
import { toDateValue } from "../../components/ui/calendar";
import { type Lesson, type LessonInput, type Student } from "../../types/api";
import { toast } from "sonner";

const lessonSchema = z.object({
  lessonDate: z.string().min(1, "Informe a data da aula."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
  isMakeup: z.boolean()
}).refine((values) => values.endTime > values.startTime, { message: "O fim deve ser posterior ao início.", path: ["endTime"] });

type LessonFormValues = z.infer<typeof lessonSchema>;

type LessonFormProps = {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  lesson?: Lesson | null;
};

export function LessonForm({ open, onClose, defaultDate, lesson = null }: LessonFormProps) {
  const isEditing = Boolean(lesson);
  const [student, setStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const searchQuery = search.trim();
  const students = useStudents(searchQuery, { enabled: open && !isEditing && searchQuery.length >= 2 });
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const mutation = isEditing ? updateLesson : createLesson;
  const resetCreateLesson = createLesson.reset;
  const resetUpdateLesson = updateLesson.reset;
  const form = useForm<LessonFormValues>({ resolver: zodResolver(lessonSchema), defaultValues: getDefaultValues(defaultDate) });

  useEffect(() => {
    if (!open) return;
    form.reset(lesson ? { lessonDate: lesson.lessonDate, startTime: lesson.startTime, endTime: lesson.endTime, isMakeup: lesson.isMakeup } : getDefaultValues(defaultDate));
    setStudent(null);
    setSearch("");
    resetCreateLesson();
    resetUpdateLesson();
  }, [defaultDate, form, lesson, open, resetCreateLesson, resetUpdateLesson]);

  async function onSubmit(values: LessonFormValues) {
    if (!isEditing && !student) {
      setSearch("");
      return;
    }
    const today = toDateValue(new Date());
    if (!isEditing && values.lessonDate < today) {
      form.setError("lessonDate", { message: "Novas aulas devem ser hoje ou em uma data futura." });
      return;
    }

    const input: LessonInput = {
      studentId: lesson?.studentId || student!.id,
      lessonDate: values.lessonDate,
      startTime: values.startTime,
      endTime: values.endTime,
      isMakeup: values.isMakeup
    };

    try {
      if (lesson) await updateLesson.mutateAsync({ id: lesson.id, input });
      else await createLesson.mutateAsync(input);
      toast.success(lesson ? "Aula atualizada com sucesso." : "Aula agendada com sucesso.");
      onClose();
    } catch {
      // O erro contextual é exibido no próprio drawer.
    }
  }

  const selectedStudent = lesson?.student || student;
  const currentCredits = selectedStudent?.credits ?? 0;
  const changingToMakeup = form.watch("isMakeup") && (!lesson || !lesson.isMakeup);
  const formError = mutation.error instanceof ApiError ? lessonErrorMessage(mutation.error.code) : mutation.isError ? "Não foi possível salvar a aula agora." : null;

  const formContent = <form id="lesson-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
    {lesson ? <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3"><StudentAvatar name={lesson.student.name} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{lesson.student.name}</p><p className="mt-1 text-xs text-slate-600">O aluno não pode ser trocado nesta edição.</p></div></div> : <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="lesson-student-search">Aluno <span className="text-red-600">*</span></Label>{selectedStudent && <button type="button" className="cursor-pointer text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900" onClick={() => setStudent(null)}>Trocar</button>}</div>{selectedStudent ? <div className="grid min-h-14 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/70" style={{ gridTemplateColumns: "minmax(0, 1fr) 3rem" }}><span className="flex min-w-0 items-center gap-3 px-3 py-3"><StudentAvatar name={selectedStudent.name} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{selectedStudent.name}</span><span className="mt-1 block truncate text-xs text-slate-600">{selectedStudent.activeWorkoutName || "Nenhum treino encontrado"}</span></span></span><span className={`flex items-center justify-center gap-1 border-l text-xs font-semibold ${selectedStudent.credits === 0 ? "border-amber-100 bg-amber-50 text-amber-900" : "border-sky-100 bg-sky-50 text-slate-600"}`} aria-label={`${selectedStudent.credits} créditos disponíveis`}><Coins aria-hidden="true" className="size-4 text-amber-700" /><span>{selectedStudent.credits}</span></span></div> : <><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600" /><Input id="lesson-student-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pelo nome do aluno" className="pl-9" autoFocus /></div>{searchQuery.length >= 2 && (students.isPending ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Buscando alunos…</p> : students.isError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Não foi possível buscar os alunos agora.</p> : students.data?.length === 0 ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Nenhum aluno encontrado.</p> : <div className="max-h-48 space-y-2 overflow-y-auto" role="listbox" aria-label="Resultados de alunos">{students.data?.slice(0, 8).map((item) => <button key={item.id} type="button" aria-label={`Selecionar ${item.name}. ${item.credits} créditos disponíveis.`} className="group grid min-h-14 w-full cursor-pointer overflow-hidden rounded-lg border border-sky-100 bg-white text-left transition-[background-color,border-color] duration-200 hover:border-sky-200 focus-visible:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30" style={{ gridTemplateColumns: "minmax(0, 1fr) 3rem" }} onClick={() => setStudent(item)}><span className="flex min-w-0 items-center gap-3 px-3 py-3 transition-colors duration-200 group-hover:bg-sky-50 group-focus-visible:bg-sky-50"><StudentAvatar name={item.name} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{item.name}</span><span className="mt-1 block truncate text-xs text-slate-600">{item.activeWorkoutName || "Nenhum treino encontrado"}</span></span></span><span className={`flex h-full w-full items-center justify-center gap-1 border-l text-xs font-semibold ${item.credits === 0 ? "border-amber-100 bg-amber-50 text-amber-900" : "border-sky-100 bg-sky-50 text-slate-600"}`} aria-hidden="true"><Coins className="size-4 text-amber-700" /><span>{item.credits}</span></span></button>)}</div>)}</>}</div>}
    <div className="space-y-2"><Label htmlFor="lesson-date">Data da aula <span className="text-red-600">*</span></Label><DatePicker id="lesson-date" name="lessonDate" value={form.watch("lessonDate")} onChange={(value) => form.setValue("lessonDate", value, { shouldValidate: true })} aria-invalid={Boolean(form.formState.errors.lessonDate)} />{form.formState.errors.lessonDate && <FieldError>{form.formState.errors.lessonDate.message}</FieldError>}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="lesson-start-time">Início <span className="text-red-600">*</span></Label><Input id="lesson-start-time" type="time" {...form.register("startTime")} aria-invalid={Boolean(form.formState.errors.startTime)} />{form.formState.errors.startTime && <FieldError>{form.formState.errors.startTime.message}</FieldError>}</div><div className="space-y-2"><Label htmlFor="lesson-end-time">Fim <span className="text-red-600">*</span></Label><Input id="lesson-end-time" type="time" {...form.register("endTime")} aria-invalid={Boolean(form.formState.errors.endTime)} />{form.formState.errors.endTime && <FieldError>{form.formState.errors.endTime.message}</FieldError>}</div></div>
    <label className="relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/80 p-3"><Repeat aria-hidden="true" className="pointer-events-none absolute -bottom-2 -right-2 size-14 text-amber-200/80" /><input type="checkbox" className="relative z-10 mt-0.5 size-4 cursor-pointer accent-amber-600" {...form.register("isMakeup")} /><span className="relative z-10"><span className="block text-sm font-semibold text-amber-950">Aula de reposição</span>{changingToMakeup && <span className="mt-1 block text-xs leading-5 text-amber-900">Usará 1 crédito de reposição.</span>}</span></label>
    {!isEditing && !selectedStudent && form.formState.isSubmitted && <FieldError>Escolha um aluno para continuar.</FieldError>}
    {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-5 text-red-800">{formError}</p>}
  </form>;

  const footer: ReactNode = <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" form="lesson-form" disabled={mutation.isPending || (!isEditing && !selectedStudent) || (changingToMakeup && currentCredits < 1)}><Save className="size-4" />{mutation.isPending ? "Salvando…" : lesson ? "Salvar alterações" : "Agendar aula"}</Button></div>;

  return <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title={lesson ? "Editar aula" : "Nova aula"} description={lesson ? "Corrija a data, o horário ou a reposição enquanto a aula estiver agendada." : "Defina o aluno, a data e o horário da aula."} footer={footer}>{formContent}</Drawer>;
}

function getDefaultValues(date: string): LessonFormValues {
  return { lessonDate: date, startTime: "08:00", endTime: "09:00", isMakeup: false };
}

function lessonErrorMessage(code: string): string {
  return {
    lesson_time_conflict: "Já existe outra aula neste horário.",
    insufficient_credits_for_makeup: "O aluno não possui crédito de reposição disponível.",
    lesson_not_editable: "Apenas aulas ainda agendadas podem ser editadas.",
    lesson_date_in_past: "Novas aulas devem ser hoje ou em uma data futura.",
    invalid_date: "Informe uma data válida.",
    end_time_before_start_time: "O fim deve ser posterior ao início."
  }[code] || "Não foi possível salvar a aula. Revise os dados e tente novamente.";
}

function FieldError({ children }: { children?: string }) {
  return <p className="text-sm text-red-700">{children}</p>;
}
