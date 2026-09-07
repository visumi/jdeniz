import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LessonForm } from "./lesson-form";

const mutations = vi.hoisted(() => ({
  create: { isPending: false, isError: false, error: null, mutateAsync: vi.fn().mockResolvedValue({}), reset: vi.fn() },
  update: { isPending: false, isError: false, error: null, mutateAsync: vi.fn().mockResolvedValue({}), reset: vi.fn() }
}));

vi.mock("../../hooks/use-lessons", () => ({
  useCreateLesson: () => mutations.create,
  useUpdateLesson: () => mutations.update
}));

vi.mock("../../hooks/use-students", () => ({
  useStudents: () => ({ isPending: false, isError: false, data: [{ id: "student-1", name: "Ana Lima", email: null, phone: null, credits: 2, activeWorkoutName: null, attendanceMode: null, birthDate: null, startDate: null, observations: null, createdAt: "", updatedAt: "" }] })
}));

afterEach(() => {
  cleanup();
  mutations.create.mutateAsync.mockClear();
  mutations.update.mutateAsync.mockClear();
  mutations.create.reset.mockClear();
  mutations.update.reset.mockClear();
});

describe("LessonForm", () => {
  it("valida o intervalo de horário antes de criar", async () => {
    const user = userEvent.setup();
    render(<LessonForm open onClose={vi.fn()} defaultDate="2099-01-01" />);

    await user.type(screen.getByLabelText(/Aluno/), "Ana");
    await user.click(await screen.findByRole("button", { name: /Ana Lima/ }));
    await user.clear(screen.getByLabelText(/Início/));
    await user.type(screen.getByLabelText(/Início/), "10:00");
    await user.clear(screen.getByLabelText(/Fim/));
    await user.type(screen.getByLabelText(/Fim/), "09:00");
    await user.click(screen.getByRole("button", { name: /agendar aula/i }));

    expect(await screen.findByText("O fim deve ser posterior ao início.")).toBeInTheDocument();
    expect(mutations.create.mutateAsync).not.toHaveBeenCalled();
  });

  it("preenche a edição e mantém o aluno fixo", () => {
    render(<LessonForm open onClose={vi.fn()} defaultDate="2099-01-01" lesson={{ id: "lesson-1", studentId: "student-1", student: { id: "student-1", name: "Ana Lima", email: null, phone: null, credits: 2, activeWorkoutName: null }, lessonDate: "2099-01-02", startTime: "08:00", endTime: "09:00", isMakeup: false, status: "scheduled", statusUpdatedAt: null, createdAt: "", updatedAt: "" }} />);

    expect(screen.getByText("Ana Lima")).toBeInTheDocument();
    expect(screen.getByText("O aluno não pode ser trocado nesta edição.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Início/)).toHaveValue("08:00");
    expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trocar" })).not.toBeInTheDocument();
  });
});
