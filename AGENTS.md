# Instruções do projeto JDeniz

## Princípio responsivo permanente

- O produto é **mobile-first**. O mobile é a fonte da verdade para conteúdo, fluxo e prioridade.
- Toda nova tela, componente ou funcionalidade deve ser criada primeiro para o viewport mobile.
- Breakpoints maiores podem apenas redistribuir, espaçar, alinhar ou ampliar o mesmo conteúdo criado para mobile.
- Não adicionar conteúdo exclusivo para desktop ou para outras resoluções: sem hero alternativo, texto extra, ações adicionais, métricas novas ou seções que desapareçam no mobile.
- Exceções são somente estruturais e equivalentes, como trocar a navegação inferior mobile por uma sidebar desktop, sem mudar o conteúdo ou a prioridade da experiência.
- A navegação mobile deve ocupar toda a largura disponível com respiro lateral e inferior. Em páginas roláveis, permanece visível durante a interação vertical e desaparece suavemente após 1,8s sem scroll; em páginas sem scroll, fica sempre visível.
- Antes de concluir qualquer implementação, verificar a tela no mobile e confirmar que as resoluções maiores são apenas uma evolução de layout.
- Animações de menus, popups e controles devem ser clean: não usar pulo, bounce, escala agressiva ou deslocamento do elemento. Preferir transições sutis de cor, opacidade, ring ou sombra.
- Todo item que surge ou desaparece na interface deve usar uma transição sutil de entrada/saída, preferencialmente opacidade e visibilidade em 150–200ms. Quando a saída precisar ser animada, manter o elemento montado durante a transição e controlar sua interatividade; nunca fazer o item simplesmente aparecer ou sumir.
- Todo modal ou drawer deve usar um drawer inferior em mobile e tablet; em desktop (`lg` ou maior), deve usar um modal centralizado, mantendo o mesmo conteúdo, fluxo e prioridade.
- Páginas internas com hierarquia de navegação devem usar o componente Breadcrumb no padrão shadcn/ui, com o item atual identificado como página e sem substituir o breadcrumb por um botão de voltar.

## UI

- Usar componentes shadcn/ui existentes ou criar novos no mesmo padrão.
- Usar tokens semânticos e cores Tailwind, com `sky` como cor principal.
- Todo botão criado deve exibir o cursor de ponteiro, usando a classe `cursor-pointer`.
- Manter acessibilidade WCAG AA, alvos de toque confortáveis e suporte a `prefers-reduced-motion`.
