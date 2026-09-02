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

    await user.type(screen.getByLabelText("Nome completo"), "Ana Lima");
    await user.type(screen.getByLabelText(/E-mail/), "ana@example.com");
    await user.click(screen.getByRole("button", { name: /salvar aluno/i }));

    expect(mutateAsync).toHaveBeenCalledWith({ name: "Ana Lima", email: "ana@example.com", phone: null });
  });
});
