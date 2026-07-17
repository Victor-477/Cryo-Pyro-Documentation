# Cryo · Burnout · Pyro — Site de Documentação

Site de documentação da linguagem **Cryo**, do compilador **Burnout** e do
bytecode **Pyro**, no estilo da documentação do Next.js: navegação lateral,
índice "nesta página", busca (Ctrl/⌘ + K), tema claro/escuro e realce de
sintaxe — tudo **estático e sem dependências externas** (nenhum CDN, nenhuma
etapa de build).

## Como abrir

**Opção 1 — abrir o arquivo direto**

Dê um duplo clique em `index.html` (ou arraste-o para o navegador).

**Opção 2 — servidor local** (recomendado; evita restrições de `file://`)

```bash
cd "Cryo Pyro Documentation"
python -m http.server 8877
# abra http://127.0.0.1:8877 no navegador
```

## Estrutura

```
Cryo Pyro Documentation/
├── index.html            # shell da página (topbar, sidebar, conteúdo, TOC)
└── assets/
    ├── styles.css        # design (tema Cryo/gelo + Pyro/fogo, claro e escuro)
    ├── highlight.js      # realce de sintaxe (cryo, bash, go, c, json)
    ├── content.js        # TODO o conteúdo da documentação (markdown por página)
    └── app.js            # roteamento por hash, render de markdown, busca, TOC
```

## Editando o conteúdo

Todo o texto vive em [`assets/content.js`](assets/content.js), como uma lista de
páginas. Cada página tem `slug`, `group`, `title`, `lead` e um `body` em
markdown. A ordem de navegação (e do rodapé anterior/próximo) segue o array
`groups` no fim do mesmo arquivo.

O conteúdo foi escrito a partir do código-fonte da linguagem
(`cryo/lexer.py`, `cryo/parser.py`, os `codegen_*.py` do Burnout, a VM em
`pyro/vm/main.go` e os exemplos em `cryo/examples/`).

## Seções

- **Primeiros passos** — introdução, arquitetura, instalação, início rápido
- **A linguagem Cryo** — sintaxe, tipos, funções, controle de fluxo, operadores,
  structs/enums, arrays, mapas, opcionais, JSON, erros
- **Concorrência & rede** — `spawn`/`await`/`future`, HTTP
- **LLM & Agentes** — schema, tools, o laço de `agent`, LLM real, skills, máquina
- **Compilador Burnout** — a CLI, backends, segurança
- **Pyro — bytecode & VM** — formato do `.pyro`, ISA, a VM
- **Referência** — builtins, palavras-chave, exemplos
