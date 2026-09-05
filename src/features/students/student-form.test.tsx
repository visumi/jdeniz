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
    await user.click(screen.getByRole("combobox", { name: /Modalidade/ }));
    await user.click(screen.getByRole("option", { name: "Online" }));
    const month = new Date();
    const dateLabel = (day: number) => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(month.getFullYear(), month.getMonth(), day));
    const dateValue = (day: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await user.click(screen.getByLabelText(/Data de nascimento/));
    await user.click(screen.getByRole("gridcell", { name: dateLabel(12) }));
    await user.click(screen.getByLabelText(/Data de início/));
    await user.click(screen.getByRole("gridcell", { name: dateLabel(3) }));
    const phoneInput = screen.getByLabelText(/Número de telefone/);
    await user.type(phoneInput, "11abc999990000");
    await user.click(screen.getByRole("button", { name: /salvar aluno/i }));

    expect(phoneInput).toHaveValue("(11) 99999-0000");
    expect(mutateAsync).toHaveBeenCalledWith({ name: "Ana Lima", attendanceMode: "online", birthDate: dateValue(12), startDate: dateValue(3), phone: "(11) 99999-0000", observations: null, email: null });
  });
});
