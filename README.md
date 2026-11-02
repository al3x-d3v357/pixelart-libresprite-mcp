# PixelArt LibreSprite MCP Server

Servidor MCP (**Model Context Protocol**) de alta performance para criação, animação, manipulação e exportação de **Pixel Art**, integrando o **LibreSprite v1.3** nativo no Linux com agentes de IA (Google Antigravity, Gemini, etc.).

## 🎨 Recursos Principais

1. **Construção Anatômica de Personagens**:
   - Resoluções 32x32 (detalhado para RPG/Metroidvania) e 16x16 (micro retrô).
   - Camadas independentes: Sombra, Pernas/Botas, Calças, Tronco/Armadura, Braços/Mãos, Cabeça/Rosto, Olhos expressivos, Cabelo/Elmo/Capuz, Armas e Outlines seletivos.
   - Classes prontas: `warrior`, `mage`, `rogue`, `paladin`, `cyberpunk_runner`, `healer`, `custom`.
   - Paletas integradas: Paleta Oficial do Alex (`alex_corporate`), `pico_8`, `dawnbringer_32` (DB32), `gameboy` e `cyberpunk_neon`.

2. **Geração Automática de Animações**:
   - Ciclos de `idle`, `walk`, `attack` (windup, strike, slash FX), `jump` e `hurt`.
   - Exportação automática de frames PNG individuais.
   - Geração de Spritesheet consolidado (PNG + JSON) compatível com **Godot**, **Unity** e **GameMaker**.
   - Geração de arquivo `.aseprite` nativo contendo a animação por quadros.

3. **Desenho Matricial Pixel-a-Pixel**:
   - Criação cirúrgica de itens, armas, monstros e tilesets usando matrizes de texto ASCII e mapeamento hexadecimal.

4. **Integração com Motor Headless do LibreSprite**:
   - Conversão e empacotamento de arquivos para `.aseprite` e `.ase`.
   - Redimensionamento por interpolação Nearest-Neighbor (sem borrão de pixel art).
   - Execução headless de scripts JavaScript no runtime do LibreSprite.
   - Abertura imediata na interface visual do LibreSprite (`--gui`).

---

## 🛠️ Ferramentas (MCP Tools)

| Ferramenta | Descrição |
|---|---|
| `pixelart_create_character` | Constrói um personagem pixel art com armas, armadura e cores, gerando PNG, `.aseprite` e prévia 4x. |
| `pixelart_animate_character` | Gera ciclo de animação (`idle`, `walk`, `attack`, `jump`, `hurt`) com frames, spritesheet e `.aseprite`. |
| `pixelart_draw_matrix` | Desenha um sprite livremente a partir de matriz ASCII + dicionário de cores hex. |
| `pixelart_build_spritesheet` | Empacota imagens em spritesheet PNG + JSON via motor do LibreSprite. |
| `pixelart_apply_palette` | Converte ou remapeia as cores de um sprite para uma paleta temática. |
| `pixelart_run_libresprite_script` | Executa script JavaScript nativo no motor do LibreSprite em modo batch. |
| `pixelart_export_scale` | Redimensiona qualquer sprite em 2x, 4x, 8x ou 16x preservando nitidez. |
| `pixelart_open_in_gui` | Abre o arquivo diretamente na tela do LibreSprite no Linux. |

---

## 🚀 Como Registrar no Antigravity

Adicione a entrada ao seu `mcp_config.json`:

```json
{
  "mcpServers": {
    "pixelart_libresprite": {
      "command": "node",
      "args": ["/media/alex/alex/mcp-servers/pixelart-libresprite-mcp/server.js"],
      "env": {
        "LIBRESPRITE_BIN": "/media/alex/alex/bin/libresprite"
      }
    }
  }
}
```

---
Desenvolvido para **Alex Sandro (@al3x-d3v357)**.
