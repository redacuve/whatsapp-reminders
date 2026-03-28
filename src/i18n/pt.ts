import { CommandDef, CommandKey } from '../types';

const commands: Record<CommandKey, CommandDef> = {
  help: { name: 'Ajuda', desc: 'Mostrar comandos disponíveis' },
  msg: { name: 'Motivar', desc: 'Enviar uma mensagem motivacional agora' },
  status: { name: 'Status', desc: 'Mostrar status do bot' },
  ping: { name: 'Ping', desc: 'Responde com pong' },
};

const motivationalMessages = [
  'Bom dia. Hoje é um novo dia para construir algo grande. Qual é o seu objetivo?',
  'Foque em UMA coisa hoje. Multitarefa é inimiga do progresso.',
  'Faça primeiro o que está evitando. Essa tarefa desconfortável é a que mais vai te fazer crescer.',
  'A disciplina supera a motivação. Não espere estar pronto, apenas comece.',
  'Pequeno progresso ainda é progresso. 1% por dia = 37 vezes ao ano.',
  'Não negocie consigo mesmo. Você fez um compromisso, honre-o.',
  'Lembre por que começou. Esse objetivo ainda está lá.',
  'O tempo é seu recurso mais valioso. Como está investindo hoje?',
  'Resultados extraordinários exigem esforço consistente, não esforço perfeito.',
  'Saia da sua zona de conforto. O crescimento vive do outro lado do medo.',
  'Não se compare aos outros. Compita com quem você era ontem.',
  'Cada dia que você pratica é um dia mais perto de onde quer estar.',
  'Perfeição é inimiga do progresso. Feito é melhor que perfeito.',
  'Seu futuro está sendo construído pelo que você faz hoje, não amanhã.',
  'Se hoje não está com vontade, faça mesmo assim. Isso se chama disciplina.',
  'Você não sobe ao nível das suas metas, cai ao nível dos seus sistemas.',
  'Pare de esperar o momento certo. O momento certo é o que você cria.',
  'Cansado? Ótimo. Significa que está indo além de onde a maioria para.',
  'O sucesso não se possui, se aluga — e o aluguel vence todo dia.',
  'A versão de você de 5 anos atrás estaria orgulhosa de onde está. Continue.',
  'Trabalhe duro em silêncio. Deixe os resultados fazerem o barulho.',
  'A energia flui para onde vai a atenção. O que está alimentando seu foco hoje?',
  'Daqui a um ano, você vai desejar ter começado hoje.',
  'Seus hábitos são votos para a pessoa que está se tornando. Escolha bem.',
  'Não se encolha para caber em um mundo que ainda não alcançou sua visão.',
  'A dor da disciplina pesa gramas. A dor do arrependimento pesa toneladas.',
  'Você tem as mesmas 24 horas que todos. O que faz com elas é a sua história.',
  'Seja a versão de você mesmo em que seu eu futuro está contando.',
  'O impulso se constrói nos momentos em que desistir parece mais fácil.',
  'Conforto é uma morte lenta. Escolha o desafio.',
];

export const pt = {
  code: 'pt',
  name: 'Português',
  commands,
  motivationalMessages,
  responses: {
    motivatePrefix: 'Aqui está uma mensagem motivacional para você! 💪',
    status: 'O bot está funcionando perfeitamente! ✅',
    ping: 'Pong! 🏓',
    unknown:
      'Desculpe, não entendi esse comando. Digite *ajuda* para ver os comandos disponíveis.',
    langChanged: '🌐 Idioma alterado para Português!',
    langInvalid: '❌ Idioma inválido. Disponíveis: en, es, pt',
  },
};
