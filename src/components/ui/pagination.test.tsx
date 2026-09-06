import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./pagination";

describe("Pagination", () => {
  it("expõe navegação acessível e dispara ações de página", async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<Pagination><PaginationContent><PaginationItem><PaginationPrevious onClick={onPrevious} /></PaginationItem><PaginationItem><PaginationLink isActive aria-label="Ir para a página 1">1</PaginationLink></PaginationItem><PaginationItem><PaginationNext onClick={onNext} /></PaginationItem></PaginationContent></Pagination>);

    expect(screen.getByRole("navigation", { name: "Paginação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir para a página 1" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Ir para a próxima página" }));
    expect(onNext).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Ir para a página anterior" }));
    expect(onPrevious).toHaveBeenCalledOnce();
  });
});
