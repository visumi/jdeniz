import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { StudentForm } from "./student-form";

const mutateAsync = vi.fn().mockResolvedValue({ id: "student-1" });

vi.mock("../../hooks/use-students", () => ({
  useCreateStudent: () => ({ isPending: false, isError: false, mutateAsync }),
  useUpdateStudent: () => ({ isPending: false, isError: false, mutateAsync })
}));

afterEach(() => {
  cleanup();
  mutateAsync.mockClear();
});

describe("StudentForm", () => {
  it("exibe validação para nome vazio", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><StudentForm /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: /salvar aluno/i }));

    expect(await screen.findByText("Informe o nome do aluno.")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("envia os dados básicos normalizados", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><StudentForm /></MemoryRouter>);

    await user.type(screen.getByLabelText(/Nome completo/), "Ana Lima");
    await user.selectOptions(screen.getByLabelText(/Modalidade/), "online");
    await user.type(screen.getByLabelText(/Data de nascimento/), "1990-04-12");
    await user.type(screen.getByLabelText(/Data de início/), "2026-09-03");
    await user.click(screen.getByRole("button", { name: /salvar aluno/i }));

    expect(mutateAsync).toHaveBeenCalledWith({ name: "Ana Lima", attendanceMode: "online", birthDate: "1990-04-12", startDate: "2026-09-03", pathology: null, observations: null, email: null, phone: null });
  });
});
