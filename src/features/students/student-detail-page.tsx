import { ArrowLeft, Mail, Pencil, Phone, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useStudent } from "../../hooks/use-students";
import { formatDate, formatDateOnly } from "../../lib/utils";
import { StudentForm } from "./student-form";

export function StudentDetailPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams();
  const student = useStudent(id);
  if (student.isPending) return <div className="space-y-5"><Skeleton className="h-10 w-24" /><Skeleton className="h-12 w-64" /><Card><CardContent className="space-y-4 p-5"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /></CardContent></Card></div>;
  if (student.isError || !student.data) return <div className="space-y-5"><Button asChild variant="ghost" className="-ml-3"><Link to="/students"><ArrowLeft className="size-4" />Voltar para alunos</Link></Button><Card><CardContent className="p-6"><p className="font-semibold">Aluno não encontrado.</p><p className="mt-1 text-sm text-muted-foreground">O cadastro pode ter sido removido ou você não tem acesso a ele.</p></CardContent></Card></div>;
  if (edit) return <StudentForm student={student.data} />;
  const currentStudent = student.data;
  return <div className="space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link to="/students"><ArrowLeft className="size-4" />Voltar para alunos</Link></Button><section className="flex flex-col gap-5 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-xl bg-sky-500 text-lg font-bold text-white">{currentStudent.name.charAt(0).toUpperCase()}</div><div><p className="text-sm font-semibold text-sky-300">Perfil do aluno</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{currentStudent.name}</h1></div></div><Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-sky-50"><Link to={`/students/${currentStudent.id}/edit`}><Pencil className="size-4" />Editar cadastro</Link></Button></section><Card><CardHeader className="border-b border-border/70"><CardTitle>Informações do aluno</CardTitle></CardHeader><CardContent className="grid gap-6 pt-5 sm:grid-cols-2"><InfoItem icon={Mail} label="E-mail" value={currentStudent.email || "Não informado"} /><InfoItem icon={Phone} label="Telefone" value={currentStudent.phone || "Não informado"} /><InfoItem label="Modalidade" value={currentStudent.attendanceMode === "online" ? "Online" : currentStudent.attendanceMode === "presencial" ? "Presencial" : "Não informado"} /><InfoItem label="Data de nascimento" value={formatDateOnly(currentStudent.birthDate)} /><InfoItem label="Data de início" value={formatDateOnly(currentStudent.startDate)} /><InfoItem label="Cadastrado em" value={formatDate(currentStudent.createdAt)} /><InfoItem label="Última atualização" value={formatDate(currentStudent.updatedAt)} />{currentStudent.observations && <div className="sm:col-span-2"><InfoItem label="Observações" value={currentStudent.observations} /></div>}</CardContent></Card></div>;
}

function InfoItem({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value: string }) {
  return <div className="flex items-start gap-3">{Icon && <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600"><Icon className="size-4" /></div>}<div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div></div>;
}
