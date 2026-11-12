import * as SQLite from 'expo-sqlite';

let instance;
const examples = [
 [1,'BANCO EXEMPLO: sua conta será bloqueada hoje. Acesse banco-exemplo-seguro.test e confirme sua senha.','golpe',1,'Bancos não pedem senhas por mensagem. A urgência e o endereço não oficial são sinais de alerta. Entre no aplicativo oficial do banco.'],
 [1,'Banco Exemplo: compra de R$ 49,90 aprovada no cartão final 1234. Se não reconhecer, ligue para o número no verso do cartão.','legitima',2,'Não pede senha nem apresenta links. Recomenda conferir a informação por um canal oficial.'],
 [2,'Sua encomenda está parada. Pague a taxa de R$ 7,90 em entrega-rapida.test para liberar a entrega.','golpe',1,'Taxa surpresa e link externo são sinais comuns de golpe. Confira seu pedido diretamente no site ou aplicativo da loja.'],
 [2,'Loja Exemplo: seu pedido 4521 saiu para entrega. Acompanhe pelo aplicativo oficial da loja.','legitima',1,'É uma atualização informativa: não solicita dados pessoais nem exige clicar em links.'],
 [3,'Você ganhou um desconto exclusivo! Clique: bit.exemplo/xk29','golpe',2,'Links encurtados escondem o destino. Evite clicar e confira ofertas no site oficial.'],
 [4,'Oi, aqui é o suporte. Para atualizar seu cadastro, envie seu CPF e o código que chegou por SMS.','golpe',3,'Nunca compartilhe códigos recebidos por SMS. Eles podem permitir acesso indevido à sua conta.'],
 [4,'Clínica Exemplo: sua consulta é amanhã às 14h. Responda 1 para confirmar ou 2 para remarcar.','legitima',2,'A mensagem pede apenas uma confirmação simples, sem solicitar senhas, documentos ou acesso a links.'],
 [5,'PARABÉNS! Você foi sorteado para ganhar um celular novo. Responda com seu nome completo e CPF.','golpe',1,'Prêmio inesperado com solicitação de CPF é um sinal de alerta. Não compartilhe dados em sorteios desconhecidos.']
];
export async function database() {
 if (instance) return instance;
 const db = await SQLite.openDatabaseAsync('sentinela.db');
 await db.execAsync(`PRAGMA foreign_keys = ON;
 CREATE TABLE IF NOT EXISTS categoria (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL UNIQUE, descricao TEXT);
 CREATE TABLE IF NOT EXISTS simulacao (id INTEGER PRIMARY KEY AUTOINCREMENT, categoria_id INTEGER NOT NULL, mensagem TEXT NOT NULL, tipo TEXT NOT NULL CHECK(tipo IN ('golpe','legitima')), nivel INTEGER NOT NULL DEFAULT 1 CHECK(nivel BETWEEN 1 AND 3), explicacao TEXT NOT NULL, FOREIGN KEY(categoria_id) REFERENCES categoria(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS resposta (id INTEGER PRIMARY KEY AUTOINCREMENT, simulacao_id INTEGER NOT NULL, acertou INTEGER NOT NULL CHECK(acertou IN (0,1)), pontos INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(simulacao_id) REFERENCES simulacao(id) ON DELETE CASCADE);
 CREATE INDEX IF NOT EXISTS idx_simulacao_categoria_nivel ON simulacao(categoria_id,nivel);
 CREATE INDEX IF NOT EXISTS idx_resposta_simulacao ON resposta(simulacao_id);`);
 const count = await db.getFirstAsync('SELECT COUNT(*) AS total FROM categoria');
 if (count.total === 0) {
  const cats = [['Falso aviso de banco','Mensagens que fingem ser do banco.'],['Falsa entrega','Cobranças e avisos falsos sobre encomendas.'],['Link suspeito','Links enganosos ou encurtados.'],['Pedido de dados pessoais','Pedidos indevidos de documentos e códigos.'],['Falso prêmio','Prêmios falsos para obter informações.']];
  await db.withTransactionAsync(async () => {
   for (const [nome, descricao] of cats) await db.runAsync('INSERT INTO categoria (nome, descricao) VALUES (?, ?)',nome,descricao);
   for (const item of examples) await db.runAsync('INSERT INTO simulacao (categoria_id,mensagem,tipo,nivel,explicacao) VALUES (?,?,?,?,?)',...item);
  });
 }
 instance = db;
 return db;
}
export const listCategories = async () => (await database()).getAllAsync('SELECT * FROM categoria ORDER BY nome');
export const listSimulations = async (category=null, level=null) => {
 const db=await database();
 return db.getAllAsync('SELECT s.*,c.nome AS categoria FROM simulacao s JOIN categoria c ON c.id=s.categoria_id WHERE (? IS NULL OR s.categoria_id=?) AND (? IS NULL OR s.nivel=?) ORDER BY c.nome,s.nivel,s.id',category,category,level,level);
};
export const randomSimulation = async (category=null,level=null) => {
 const db=await database();
 return db.getFirstAsync('SELECT s.*, c.nome AS categoria FROM simulacao s JOIN categoria c ON c.id=s.categoria_id WHERE (? IS NULL OR s.categoria_id=?) AND (? IS NULL OR s.nivel=?) ORDER BY RANDOM() LIMIT 1',category,category,level,level);
};
export async function saveAnswer(simulationId, correct) {
 const db=await database();
 const points=correct ? 10 : 0;
 await db.runAsync('INSERT INTO resposta (simulacao_id,acertou,pontos) VALUES (?,?,?)',simulationId,correct ? 1 : 0,points);
 return points;
}
export async function stats() {
 const db=await database();
 const overall=await db.getFirstAsync('SELECT COUNT(*) AS total, COALESCE(SUM(acertou),0) AS acertos, COALESCE(SUM(pontos),0) AS pontos FROM resposta');
 const categories=await db.getAllAsync(`SELECT c.id,c.nome,COUNT(r.id) AS tentativas,COALESCE(SUM(CASE WHEN r.acertou=0 THEN 1 ELSE 0 END),0) AS erros,COALESCE(SUM(r.acertou),0) AS acertos FROM categoria c LEFT JOIN simulacao s ON s.categoria_id=c.id LEFT JOIN resposta r ON r.simulacao_id=s.id GROUP BY c.id,c.nome ORDER BY erros DESC,c.nome`);
 return { ...overall, categories, nivel: Math.floor(overall.pontos/100)+1, progresso: overall.pontos%100, recomendada:categories.find(c=>c.erros>0) || null };
}
export async function saveCategory(data) {
 const db=await database();
 if(data.id) return db.runAsync('UPDATE categoria SET nome=?,descricao=? WHERE id=?',data.nome.trim(),data.descricao.trim(),data.id);
 return db.runAsync('INSERT INTO categoria (nome,descricao) VALUES (?,?)',data.nome.trim(),data.descricao.trim());
}
export async function deleteCategory(id){return (await database()).runAsync('DELETE FROM categoria WHERE id=?',id);}
export async function saveSimulation(data){
 const db=await database();
 const values=[Number(data.categoria_id),data.mensagem.trim(),data.tipo,Number(data.nivel),data.explicacao.trim()];
 if(data.id)return db.runAsync('UPDATE simulacao SET categoria_id=?, mensagem=?, tipo=?, nivel=?, explicacao=? WHERE id=?',...values,data.id);
 return db.runAsync('INSERT INTO simulacao (categoria_id,mensagem,tipo,nivel,explicacao) VALUES (?,?,?,?,?)',...values);
}
export async function deleteSimulation(id){return (await database()).runAsync('DELETE FROM simulacao WHERE id=?',id);}
