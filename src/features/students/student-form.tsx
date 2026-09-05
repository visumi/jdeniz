import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from "../../components/ui/breadcrumb";
import { Drawer } from "../../components/ui/drawer";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DatePicker } from "../../components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { useCreateStudent, useUpdateStudent } from "../../hooks/use-students";
import { type Student } from "../../types/api";

const studentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do aluno.").max(120, "Use no máximo 120 caracteres."),
  attendanceMode: z.string().min(1, "Escolha a modalidade.").refine((value): boolean => value === "online" || value === "presencial", "Escolha uma modalidade válida."),
  birthDate: z.string().min(1, "Informe a data de nascimento."),
  startDate: z.string().min(1, "Informe a data de início."),
  phone: z.string().max(40, "Use no máximo 40 caracteres."),
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
  const formId = drawer ? student ? "student-form-drawer-edit" : "student-form-drawer" : "student-form-page";
  const form = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema), defaultValues: getDefaultValues(student) });
  const phoneField = form.register("phone");

  useEffect(() => {
    form.reset(getDefaultValues(student));
  }, [form, open, student]);

  async function onSubmit(values: StudentFormValues) {
    const saved = await mutation.mutateAsync({
      name: values.name,
      attendanceMode: values.attendanceMode as "online" | "presencial",
      birthDate: values.birthDate,
      startDate: values.startDate,
      phone: values.phone || null,
      observations: values.observations || null,
      email: student?.email || null,
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
    <div className="space-y-2"><Label htmlFor="attendanceMode">Modalidade <span className="text-red-600">*</span></Label><Controller control={form.control} name="attendanceMode" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="attendanceMode" ref={field.ref} onBlur={field.onBlur} aria-invalid={Boolean(form.formState.errors.attendanceMode)}><SelectValue placeholder="Selecione uma modalidade" /></SelectTrigger><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="presencial">Presencial</SelectItem></SelectContent></Select>} />{form.formState.errors.attendanceMode && <FieldError>{form.formState.errors.attendanceMode.message}</FieldError>}</div>
    <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="birthDate">Data de nascimento <span className="text-red-600">*</span></Label><Controller control={form.control} name="birthDate" render={({ field }) => <DatePicker id="birthDate" name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={Boolean(form.formState.errors.birthDate)} />} />{form.formState.errors.birthDate && <FieldError>{form.formState.errors.birthDate.message}</FieldError>}</div><div className="space-y-2"><Label htmlFor="startDate">Data de início <span className="text-red-600">*</span></Label><Controller control={form.control} name="startDate" render={({ field }) => <DatePicker id="startDate" name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={Boolean(form.formState.errors.startDate)} />} />{form.formState.errors.startDate && <FieldError>{form.formState.errors.startDate.message}</FieldError>}</div></div>
    <div className="space-y-2"><Label htmlFor="phone">Número de telefone <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" maxLength={15} {...phoneField} onChange={(event) => { event.target.value = formatPhone(event.target.value); void phoneField.onChange(event); }} aria-invalid={Boolean(form.formState.errors.phone)} placeholder="(00) 00000-0000" />{form.formState.errors.phone && <FieldError>{form.formState.errors.phone.message}</FieldError>}</div>
    <div className="space-y-2"><Label htmlFor="observations">Observações <span className="font-normal text-muted-foreground">(opcional)</span></Label><Textarea id="observations" {...form.register("observations")} aria-invalid={Boolean(form.formState.errors.observations)} placeholder="Anotações importantes sobre o aluno" />{form.formState.errors.observations && <FieldError>{form.formState.errors.observations.message}</FieldError>}</div>
    {mutation.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-5 text-red-800">Não foi possível salvar o cadastro. Revise os dados e tente novamente.</p>}
  </>;

  const formActions = <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={drawer ? onClose : undefined} asChild={!drawer}>{drawer ? "Cancelar" : <Link to={student ? `/students/${student.id}` : "/students"}>Cancelar</Link>}</Button><Button type="submit" form={formId} className="bg-sky-600 hover:bg-sky-700" disabled={mutation.isPending}><Save className="size-4" />{mutation.isPending ? "Salvando…" : student ? "Salvar alterações" : "Salvar aluno"}</Button></div>;
  const formContent = <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>{formFields}{!drawer && <div className="border-t border-sky-100 pt-4">{formActions}</div>}</form>;

  if (drawer) return <Drawer open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.(); }} title={student ? "Editar aluno" : "Novo aluno"} description={student ? "Atualize os dados essenciais do aluno." : "Cadastre os dados essenciais para acompanhar seus treinos e avaliações."} footer={formActions}>{formContent}</Drawer>;
  return <div className="mx-auto max-w-2xl space-y-6"><Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to="/students">Alunos</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{student ? "Editar cadastro" : "Novo cadastro"}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb><div><p className="text-sm font-semibold text-sky-700">{student ? "Editar cadastro" : "Novo cadastro"}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{student ? student.name : "Cadastrar aluno"}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Registre o essencial agora. O perfil pode crescer junto com o acompanhamento.</p></div><div className="rounded-xl border border-sky-100 bg-white p-5 sm:p-6">{formContent}</div></div>;
}

function getDefaultValues(student?: Student): StudentFormValues {
  return { name: student?.name || "", attendanceMode: student?.attendanceMode || "", birthDate: student?.birthDate || "", startDate: student?.startDate || "", phone: formatPhone(student?.phone || ""), observations: student?.observations || "" };
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length < 2) return `(${digits}`;
  if (digits.length === 2) return `(${digits}) `;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function FieldError({ children }: { children?: string }) {
  return <p className="text-sm text-red-700">{children}</p>;
}
