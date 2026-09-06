import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateWorkout } from "../../hooks/use-workouts";
import { type WorkoutObjective, WORKOUT_OBJECTIVES } from "../../types/api";
import { Button } from "../../components/ui/button";
import { DatePicker } from "../../components/ui/date-picker";
import { Drawer } from "../../components/ui/drawer";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";

const objectiveLabels: Record<WorkoutObjective, string> = {
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  saude_longevidade: "Saúde e longevidade",
  performance: "Performance",
  lesao: "Lesão"
};

const workoutSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do treino.").max(120, "Use no máximo 120 caracteres."),
  objective: z.string().refine((value): value is WorkoutObjective => WORKOUT_OBJECTIVES.includes(value as WorkoutObjective), "Escolha um objetivo."),
  frequencyPerWeek: z.string().regex(/^[1-7]$/, "Escolha uma frequência entre 1 e 7 vezes."),
  startDate: z.string().min(1, "Informe a data de início."),
  endDate: z.string().min(1, "Informe a data de fim."),
  observations: z.string().max(1000, "Use no máximo 1.000 caracteres.")
}).refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
  message: "A data de fim deve ser igual ou posterior à data de início.",
  path: ["endDate"]
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;

export function WorkoutForm({ studentId, open, onClose }: { studentId: string; open: boolean; onClose: () => void }) {
  const createWorkout = useCreateWorkout(studentId);
  const resetCreateWorkout = createWorkout.reset;
  const form = useForm<WorkoutFormValues>({ resolver: zodResolver(workoutSchema), defaultValues: getDefaultValues() });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
      resetCreateWorkout();
    }
  }, [form, open, resetCreateWorkout]);

  async function onSubmit(values: WorkoutFormValues) {
    await createWorkout.mutateAsync({
      name: values.name,
      objective: values.objective,
      frequencyPerWeek: Number(values.frequencyPerWeek),
      startDate: values.startDate,
      endDate: values.endDate,
      observations: values.observations || null
    });
    onClose();
  }

  const formContent = <form id="workout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
    <div className="space-y-2"><Label htmlFor="workout-name">Nome do treino <span className="text-red-600">*</span></Label><Input id="workout-name" {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} placeholder="Ex.: Treino de adaptação" />{form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}</div>
    <div className="space-y-2"><Label htmlFor="workout-objective">Objetivo <span className="text-red-600">*</span></Label><Controller control={form.control} name="objective" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="workout-objective" ref={field.ref} onBlur={field.onBlur} aria-invalid={Boolean(form.formState.errors.objective)}><SelectValue placeholder="Selecione um objetivo" /></SelectTrigger><SelectContent>{WORKOUT_OBJECTIVES.map((objective) => <SelectItem key={objective} value={objective}>{objectiveLabels[objective]}</SelectItem>)}</SelectContent></Select>} />{form.formState.errors.objective && <FieldError>{form.formState.errors.objective.message}</FieldError>}</div>
    <div className="space-y-2"><Label htmlFor="workout-frequency">Frequência <span className="text-red-600">*</span></Label><Controller control={form.control} name="frequencyPerWeek" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="workout-frequency" ref={field.ref} onBlur={field.onBlur} aria-invalid={Boolean(form.formState.errors.frequencyPerWeek)}><SelectValue placeholder="Quantas vezes por semana?" /></SelectTrigger><SelectContent>{Array.from({ length: 7 }, (_, index) => String(index + 1)).map((value) => <SelectItem key={value} value={value}>{value} {value === "1" ? "vez por semana" : "vezes por semana"}</SelectItem>)}</SelectContent></Select>} />{form.formState.errors.frequencyPerWeek && <FieldError>{form.formState.errors.frequencyPerWeek.message}</FieldError>}</div>
    <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="workout-start-date">Data de início <span className="text-red-600">*</span></Label><Controller control={form.control} name="startDate" render={({ field }) => <DatePicker id="workout-start-date" name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={Boolean(form.formState.errors.startDate)} />} />{form.formState.errors.startDate && <FieldError>{form.formState.errors.startDate.message}</FieldError>}</div><div className="space-y-2"><Label htmlFor="workout-end-date">Data de fim <span className="text-red-600">*</span></Label><Controller control={form.control} name="endDate" render={({ field }) => <DatePicker id="workout-end-date" name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={Boolean(form.formState.errors.endDate)} />} />{form.formState.errors.endDate && <FieldError>{form.formState.errors.endDate.message}</FieldError>}</div></div>
    <div className="space-y-2"><Label htmlFor="workout-observations">Observações <span className="font-normal text-muted-foreground">(opcional)</span></Label><Textarea id="workout-observations" {...form.register("observations")} aria-invalid={Boolean(form.formState.errors.observations)} placeholder="Anotações importantes sobre este treino" />{form.formState.errors.observations && <FieldError>{form.formState.errors.observations.message}</FieldError>}</div>
    {createWorkout.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-5 text-red-800">Não foi possível salvar o treino. Revise os dados e tente novamente.</p>}
  </form>;

  const formActions = <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose} disabled={createWorkout.isPending}>Cancelar</Button><Button type="submit" form="workout-form" disabled={createWorkout.isPending}><Save className="size-4" />{createWorkout.isPending ? "Salvando…" : "Salvar treino"}</Button></div>;

  return <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title="Novo treino" description="Defina o próximo ciclo de acompanhamento do aluno." footer={formActions}>{formContent}</Drawer>;
}

function getDefaultValues(): WorkoutFormValues {
  return { name: "", objective: "", frequencyPerWeek: "", startDate: "", endDate: "", observations: "" };
}

function FieldError({ children }: { children?: string }) {
  return <p className="text-sm text-red-700">{children}</p>;
}
