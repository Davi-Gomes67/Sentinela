# 🛡️ Sentinela | Expo SDK 56 + SQLite

Aplicativo educativo para identificar golpes digitais. Implementação baseada no documento **E2_Sentinela**, seção 5, seguindo as cinco telas e as três tabelas previstas.

## Funcionalidades
- **Início:** nível, pontos, barra de progresso e categoria recomendada pelo maior número de erros.
- **Simulação:** sorteio de mensagem fictícia e escolha entre **Suspeita de golpe** e **Legítima**.
- **Resultado:** correção, +10 pontos por acerto, sinais de alerta, orientações e próxima questão.
- **Desempenho:** acertos, erros, taxa geral e resumo por categoria, com opção de treinar o assunto.
- **Conteúdo:** listar e filtrar por categoria/nível, cadastrar, editar e excluir **categorias e simulações**.
- **SQLite offline:** tabelas `categoria`, `simulacao`, `resposta`, índices, relacionamentos 1:N e consultas parametrizadas `?`.
- Dados iniciais: **5 categorias e 8 simulações fictícias**. As respostas começam vazias para não contaminar o desempenho real.

## Executar

Recomendado Node.js compatível com o SDK 56. Instale as dependências:

```bash
npm install
npx expo install --fix
npx expo start
```

Abra no **Expo Go compatível com SDK 56**. Importante: segundo o anúncio oficial do Expo, a versão 56 do Expo Go **não está disponível diretamente nas lojas**. Em Android, use a versão instalada pelo Expo CLI; no iPhone, siga os caminhos de TestFlight/EAS Go indicados pelo Expo. Alternativamente, use um development build compatível.

Se `npx expo install --fix` ajustar versões secundárias para a matriz do SDK 56, confirme e envie também o `package-lock.json` gerado.

## Estrutura

```text
App.js                # Cinco telas, navegação e formulário CRUD
src/database.js       # SQLite: schema, seeds, INSERT/SELECT/UPDATE/DELETE, JOIN e GROUP BY
app.json              # Expo
package.json          # Dependências
```

## Banco e critérios

- `categoria(id, nome, descricao)`
- `simulacao(id, categoria_id, mensagem, tipo, nivel, explicacao)`
- `resposta(id, simulacao_id, acertou, pontos, data)`

Restrições: `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `CHECK` e `DEFAULT`. Exclusão em cascata entre categoria/simulação/resposta. `PRAGMA foreign_keys=ON`.

As mensagens e links são fictícios (`.test`); nunca abra o navegador para sites de exemplo.

## Testes manuais recomendados

1. Abrir Início: nível 1 e 0 pontos antes de responder.
2. Escolher Suspeita/Legítima: registrar resposta, exibir explicação e ganhar 10 pontos apenas quando acertar.
3. Reiniciar aplicativo: histórico e pontuação devem permanecer no aparelho.
4. Filtrar conteúdo por categoria e dificuldade.
5. Cadastrar, editar e apagar simulação e categoria. Testar duplicidade de nome e validações obrigatórias.
6. Errar uma categoria e verificar a recomendação no Início.
7. Verificar que os links fictícios não são clicáveis e que as consultas usam parâmetros.

## Equipe e Responsabilidades

* **Matheus Henrique Rocha Torres Pereira dos Anjos** — Designer UI/UX e Documentador (responsável pelo design das telas, construção do ícone, identidade visual e documentação do projeto).
* **Nicolas Barrocos de Andrade** — Testador (QA) (responsável pela realização de testes, registro de problemas e verificação das correções).
* **Davi Gomes de Alencar** — Líder de Projeto (responsável pela organização da equipe, acompanhamento das atividades e integração das entregas).
* **Arthur Fontoura Rodrigues** — Testador (QA) (responsável pela execução de testes, identificação de erros e validação do funcionamento do aplicativo).
* **Raphaely Monteiro da Silva** — Product Owner (responsável pela definição dos requisitos, organização do backlog e validação das funcionalidades).
* **Joaquim de Souza Araujo** — Desenvolvedor Mobile (responsável pelo desenvolvimento e implementação das funcionalidades do aplicativo).

**Observação:** testes de execução no Expo Go físico ainda devem ser realizados pela equipe. A documentação da entrega inclui evidências (prints do aparelho e commits de cada integrante) que só podem ser produzidas pelos respectivos membros.

.
