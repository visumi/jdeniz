import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Drawer } from "../../components/ui/drawer";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { useCreateStudent, useUpdateStudent } from "../../hooks/use-students";
import { type Student } from "../../types/api";

const studentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do aluno.").max(120, "Use no máximo 120 caracteres."),
  attendanceMode: z.string().min(1, "Escolha a modalidade.").refine((value) => value === "online" || value === "presencial", "Escolha uma modalidade válida."),
  birthDate: z.string().min(1, "Informe a data de nascimento."),
  startDate: z.string().min(1, "Informe a data de início."),
  pathology: z.string().max(120, "Use no máximo 120 caracteres."),
  observations: z.string().max(1000, "Use no máximo 1.000 caracteres.")
});

type StudentFormValues = z.infer<typeof studentSchema>;

type StudentFormProps = {
  student?: Student;
  drawer?: boolean;
  open?: boolean;
  onClose?: () => void;
};

export function StudentForm({ student, drawer = false, open = true, onClose }: StudentFormProps) {
  const navigate = useNavigate();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(student?.id || "");
  const mutation = student ? updateStudent : createStudent;
  const formId = drawer ? "student-form-drawer" : "student-form-page";
  const form = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema), defaultValues: getDefaultValues(student) });

  useEffect(() => {
    form.reset(getDefaultValues(student));
  }, [form, open, student]);

  async function onSubmit(values: StudentFormValues) {
    const saved = await mutation.mutateAsync({
      name: values.name,
      attendanceMode: values.attendanceMode as "online" | "presencial",
      birthDate: values.birthDate,
      startDate: values.startDate,
      pathology: values.pathology || null,
      observations: values.observations || null,
      email: student?.email || null,
      phone: student?.phone || null
    });
    if (drawer) {
      form.reset(getDefaultValues(undefined));
      onClose?.();
      return;
    }
    navigate(`/students/${saved.id}`);
  }

  const formFields = <>
    <div className="space-y-2"><Label htmlFor="name">Nome completo <span className="text-red-600">*</span></Label><Input id="name" autoFocus={!drawer} {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} placeholder="Digite o nome completo" />{form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}</div>
    <div className="space-y-2"><Label htmlFor="attendanceMode">Modalidade <span className="text-red-600">*</span></Label><Select id="attendanceMode" {...form.register("attendanceMode")} aria-invalid={Boolean(form.formState.errors.attendanceMode)}><option value="">Selecione uma modalidade</option><option value="online">Online</option><option value="presencial">Presencial</option></Select>{form.formState.errors.attendanceMode && <FieldError>{form.formState.errors.attendanceMode.message}</FieldError>}</div>
    <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="birthDate">Data de nascimento <span className="text-red-600">*</span></Label><Input id="birthDate" type="date" {...form.register("birthDate")} aria-invalid={Boolean(form.formState.errors.birthDate)} />{form.formState.errors.birthDate && <FieldError>{form.formState.errors.birthDate.message}</FieldError>}</div><div className="space-y-2"><Label htmlFor="startDate">Data de início <span className="text-red-600">*</span></Label><Input id="startDate" type="date" {...form.register("startDate")} aria-invalid={Boolean(form.formState.errors.startDate)} />{form.formState.errors.startDate && <FieldError>{form.formState.errors.startDate.message}</FieldError>}</div></div>
    <div className="space-y-2"><Label htmlFor="pathology">Patologia <span className="font-normal text-muted-foreground">(opcional)</span></Label><Select id="pathology" {...form.register("pathology")}><option value="">Não informado</option><option value="Ortopédica">Ortopédica</option><option value="Neurológica">Neurológica</option><option value="Cardiorrespiratória">Cardiorrespiratória</option><option value="Outra">Outra</option></Select>{form.formState.errors.pathology && <FieldError>{form.formState.errors.pathology.message}</FieldError>}</div>
    <div className="space-y-2"><Label htmlFor="observations">Observações <span className="font-normal text-muted-foreground">(opcional)</span></Label><Textarea id="observations" {...form.register("observations")} aria-invalid={Boolean(form.formState.errors.observations)} placeholder="Anotações importantes sobre o aluno" />{form.formState.errors.observations && <FieldError>{form.formState.errors.observations.message}</FieldError>}</div>
    {mutation.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-5 text-red-800">Não foi possível salvar o cadastro. Revise os dados e tente novamente.</p>}
  </>;

  const formActions = <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={drawer ? onClose : undefined} asChild={!drawer}>{drawer ? "Cancelar" : <Link to={student ? `/students/${student.id}` : "/students"}>Cancelar</Link>}</Button><Button type="submit" form={formId} className="bg-sky-600 hover:bg-sky-700" disabled={mutation.isPending}><Save className="size-4" />{mutation.isPending ? "Salvando…" : student ? "Salvar alterações" : "Salvar aluno"}</Button></div>;
  const formContent = <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>{formFields}{!drawer && <div className="border-t border-sky-100 pt-4">{formActions}</div>}</form>;

  if (drawer) return <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.(); }} title="Novo aluno" description="Cadastre os dados essenciais para acompanhar seus treinos e avaliações." footer={formActions}>{formContent}</Drawer>;
  return <div className="mx-auto max-w-2xl space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link to={student ? `/students/${student.id}` : "/students"}><ArrowLeft className="size-4" />Voltar</Link></Button><div><p className="text-sm font-semibold text-sky-700">{student ? "Editar cadastro" : "Novo cadastro"}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{student ? student.name : "Cadastrar aluno"}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Registre o essencial agora. O perfil pode crescer junto com o acompanhamento.</p></div><div className="rounded-xl border border-sky-100 bg-white p-5 sm:p-6">{formContent}</div></div>;
}

function getDefaultValues(student?: Student): StudentFormValues {
  return { name: student?.name || "", attendanceMode: student?.attendanceMode || "", birthDate: student?.birthDate || "", startDate: student?.startDate || "", pathology: student?.pathology || "", observations: student?.observations || "" };
}

function FieldError({ children }: { children?: string }) {
  return <p className="text-sm text-red-700">{children}</p>;
}
