import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkoutForm } from "./workout-form";

const workoutMutation = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  mutateAsync: vi.fn().mockResolvedValue({ id: "workout-1" }),
  reset: vi.fn()
}));

vi.mock("../../hooks/use-workouts", () => ({
  useCreateWorkout: () => workoutMutation
}));

afterEach(() => {
  cleanup();
  workoutMutation.isPending = false;
  workoutMutation.isError = false;
  workoutMutation.mutateAsync.mockClear();
  workoutMutation.reset.mockClear();
});

describe("WorkoutForm", () => {
  it("exibe validações para os campos obrigatórios", async () => {
    const user = userEvent.setup();
    render(<WorkoutForm studentId="student-1" open onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /salvar treino/i }));

    expect(await screen.findByText("Informe o nome do treino.")).toBeInTheDocument();
    expect(await screen.findByText("Escolha um objetivo.")).toBeInTheDocument();
    expect(screen.getByText("Escolha uma frequência entre 1 e 7 vezes.")).toBeInTheDocument();
    expect(screen.getByText("Informe a data de início.")).toBeInTheDocument();
    expect(screen.getByText("Informe a data de fim.")).toBeInTheDocument();
    expect(workoutMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("desabilita o envio enquanto salva e exibe erro da API", () => {
    workoutMutation.isPending = true;
    workoutMutation.isError = true;
    render(<WorkoutForm studentId="student-1" open onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: /salvando/i })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar o treino.");
  });
});
