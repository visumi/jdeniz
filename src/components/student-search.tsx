import { AlertCircle, Check, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { useStudents } from "../hooks/use-students";
import { StudentAvatar } from "./student-avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

export function StudentSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim();
  const students = useStudents(debouncedQuery, { enabled: open && debouncedQuery.length > 0 });
  const isWaiting = normalizedQuery.length > 0 && normalizedQuery !== debouncedQuery;
  const showResults = open && normalizedQuery.length > 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(normalizedQuery), 180);
    return () => window.clearTimeout(timeoutId);
  }, [normalizedQuery]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      event.currentTarget.blur();
    }
  }

  return <div ref={searchRef} className="relative w-full" role="combobox" aria-expanded={showResults} aria-haspopup="listbox">
    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-sky-600" />
    <Input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} placeholder="Buscar aluno" className="h-10 rounded-full border-sky-200 bg-white pl-9 pr-10 shadow-none placeholder:text-slate-500" aria-label="Buscar aluno por nome" aria-autocomplete="list" aria-controls="student-search-results" autoComplete="off" spellCheck={false} />
    {query && <Button type="button" variant="ghost" size="icon" aria-label="Limpar busca" className="absolute right-1 top-1/2 size-8 min-h-8 -translate-y-1/2 rounded-full text-slate-400 hover:bg-transparent hover:text-sky-700" onClick={() => { setQuery(""); setDebouncedQuery(""); setOpen(true); }}><X className="size-4" /></Button>}
    <Card id="student-search-results" role="listbox" aria-label="Resultados da busca" aria-hidden={!showResults} data-state={showResults ? "open" : "closed"} className="ui-popover absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden border-sky-100 bg-white shadow-[0_4px_8px_rgba(15,23,42,0.16)]">
      <CardContent className="p-2">
        {showResults && (isWaiting || students.isPending) && <div className="space-y-2" aria-label="Buscando alunos" aria-live="polite"><SearchSkeleton /><SearchSkeleton /><SearchSkeleton /></div>}
        {showResults && !isWaiting && students.isError && <div role="alert" className="flex items-start gap-3 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-800"><AlertCircle className="mt-0.5 size-4 shrink-0" /><div><p className="font-semibold">Não foi possível buscar agora.</p><p className="mt-1 text-red-700">Verifique sua conexão e tente novamente.</p><Button type="button" variant="link" className="mt-1 min-h-8 h-8 px-0 text-red-700 hover:text-red-900" onClick={() => void students.refetch()}>Tentar novamente</Button></div></div>}
        {showResults && !isWaiting && !students.isPending && !students.isError && students.data.length === 0 && <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700"><Search className="mt-0.5 size-4 shrink-0 text-slate-500" /><div><p className="font-semibold">Nenhum aluno encontrado.</p><p className="mt-1 text-slate-600">Tente buscar por outra parte do nome.</p></div></div>}
        {showResults && !isWaiting && !students.isPending && !students.isError && students.data.length > 0 && <div className="max-h-72 space-y-1 overflow-y-auto" aria-live="polite">{students.data.map((student) => <Link key={student.id} role="option" aria-selected="false" to={`/students/${student.id}`} className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-[background-color,border-color] duration-200 hover:border-sky-100 hover:bg-sky-50 focus-visible:border-sky-300 focus-visible:bg-sky-50" onClick={() => setOpen(false)}><span className="transition-transform duration-200 group-hover:scale-105"><StudentAvatar name={student.name} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{student.name}</span><span className="mt-0.5 block truncate text-xs text-slate-600">{student.email || student.phone || "Cadastro básico"}</span></span><Check aria-hidden="true" className="size-4 shrink-0 text-sky-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" /></Link>)}</div>}
      </CardContent>
    </Card>
  </div>;
}

function SearchSkeleton() {
  return <div className="flex items-center gap-3 rounded-lg px-3 py-2.5"><Skeleton className="size-10 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-2.5 w-1/2" /></div></div>;
}
