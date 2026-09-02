import { ArrowLeft, Mail, Pencil, Phone, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useStudent } from "../../hooks/use-students";
import { formatDate } from "../../lib/utils";
import { StudentForm } from "./student-form";

export function StudentDetailPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams();
  const student = useStudent(id);
  if (student.isPending) return <div className="space-y-5"><Skeleton className="h-10 w-24" /><Skeleton className="h-12 w-64" /><Card><CardContent className="space-y-4 p-5"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /></CardContent></Card></div>;
  if (student.isError || !student.data) return <div className="space-y-5"><Button asChild variant="ghost" className="-ml-3"><Link to="/students"><ArrowLeft className="size-4" />Voltar para alunos</Link></Button><Card><CardContent className="p-6"><p className="font-semibold">Aluno não encontrado.</p><p className="mt-1 text-sm text-muted-foreground">O cadastro pode ter sido removido ou você não tem acesso a ele.</p></CardContent></Card></div>;
  if (edit) return <StudentForm student={student.data} />;
  const currentStudent = student.data;
  return <div className="space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link to="/students"><ArrowLeft className="size-4" />Voltar para alunos</Link></Button><section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UserRound className="size-7" /></div><div><p className="text-sm font-semibold text-primary">Perfil do aluno</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{currentStudent.name}</h1></div></div><Button asChild variant="secondary"><Link to={`/students/${currentStudent.id}/edit`}><Pencil className="size-4" />Editar cadastro</Link></Button></section><Card><CardHeader><CardTitle>Informações básicas</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><InfoItem icon={Mail} label="E-mail" value={currentStudent.email || "Não informado"} /><InfoItem icon={Phone} label="Telefone" value={currentStudent.phone || "Não informado"} /><InfoItem label="Cadastrado em" value={formatDate(currentStudent.createdAt)} /><InfoItem label="Última atualização" value={formatDate(currentStudent.updatedAt)} /></CardContent></Card></div>;
}

function InfoItem({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value: string }) {
  return <div className="flex items-start gap-3">{Icon && <Icon className="mt-0.5 size-4 text-primary" />}<div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div></div>;
}
