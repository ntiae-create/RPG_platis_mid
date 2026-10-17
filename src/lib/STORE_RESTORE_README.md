# Restauração do store.ts

O arquivo `src/lib/store.ts` foi corrompido acidentalmente (substituído por placeholder).

## Como restaurar agora

```bash
git clone https://github.com/ntiae-create/RPG_platis_mid.git
cd RPG_platis_mid

# Opção 1: restaurar da história do git (versão antes da corrupção)
git show 873fd95a8c0e:src/lib/store.ts > src/lib/store.ts

# Opção 2: aplicar a integração de comandos de habilidade
node scripts/apply-skill-commands-to-store.mjs

# Verificar
grep -n skill-combat-integration src/lib/store.ts
```

## O que já está no repo (funcional)

- `src/lib/skill-command-parser.ts` — parser de `/efeito`, `[dados]`, `!N%`
- `src/lib/skill-command-executor.ts` — executor com semântica de percentual
- `src/lib/skill-combat-integration.ts` — ponte para o combate
- `scripts/test-skill-commands.mjs` — 31 testes
- `scripts/apply-skill-commands-to-store.mjs` — aplica o patch no store
- `scripts/store-skill-commands.patch` — diff do patch

Após restaurar o store e rodar o apply script, os comandos nas habilidades funcionam no `rollCombat`.
