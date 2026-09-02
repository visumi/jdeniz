import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useCreateStudent, useUpdateStudent } from "../../hooks/use-students";
import { type Student } from "../../types/api";

const studentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do aluno.").max(120, "Use no máximo 120 caracteres."),
  email: z.string().trim().refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Informe um e-mail válido."),
  phone: z.string().trim().max(40, "Use no máximo 40 caracteres.")
});

type StudentFormValues = z.infer<typeof studentSchema>;

export function StudentForm({ student }: { student?: Student }) {
  const navigate = useNavigate();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(student?.id || "");
  const mutation = student ? updateStudent : createStudent;
  const form = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema), defaultValues: { name: student?.name || "", email: student?.email || "", phone: student?.phone || "" } });

  useEffect(() => {
    form.reset({ name: student?.name || "", email: student?.email || "", phone: student?.phone || "" });
  }, [form, student]);

  async function onSubmit(values: StudentFormValues) {
    const saved = await mutation.mutateAsync({ name: values.name, email: values.email || null, phone: values.phone || null });
    navigate(`/students/${saved.id}`);
  }

  return <div className="mx-auto max-w-2xl space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link to={student ? `/students/${student.id}` : "/students"}><ArrowLeft className="size-4" />Voltar</Link></Button><div><p className="text-sm font-semibold text-primary">{student ? "Editar cadastro" : "Novo cadastro"}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{student ? student.name : "Cadastrar aluno"}</h1></div><Card><CardHeader><CardTitle>Informações básicas</CardTitle><CardDescription>Comece com o essencial. Você poderá completar este perfil conforme a plataforma crescer.</CardDescription></CardHeader><CardContent><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate><div className="space-y-2"><Label htmlFor="name">Nome completo</Label><Input id="name" autoFocus {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} />{form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}</div><div className="space-y-2"><Label htmlFor="email">E-mail <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="email" type="email" inputMode="email" {...form.register("email")} aria-invalid={Boolean(form.formState.errors.email)} />{form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}</div><div className="space-y-2"><Label htmlFor="phone">Telefone <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="phone" type="tel" inputMode="tel" {...form.register("phone")} aria-invalid={Boolean(form.formState.errors.phone)} />{form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}</div>{mutation.isError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm leading-5 text-destructive">Não foi possível salvar o cadastro. Revise os dados e tente novamente.</p>}<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" asChild><Link to={student ? `/students/${student.id}` : "/students"}>Cancelar</Link></Button><Button type="submit" disabled={mutation.isPending}><Save className="size-4" />{mutation.isPending ? "Salvando…" : student ? "Salvar alterações" : "Salvar aluno"}</Button></div></form></CardContent></Card></div>;
}
