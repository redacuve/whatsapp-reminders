import { CommandDef, CommandKey } from '../types';

const commands: Record<CommandKey, CommandDef> = {
  help: { name: 'Ayuda', desc: 'Mostrar comandos disponibles' },
  msg: { name: 'Motivar', desc: 'Enviar un mensaje motivacional ahora' },
  status: { name: 'Estado', desc: 'Mostrar estado del bot' },
  ping: { name: 'Ping', desc: 'Responde con pong' },
};

const motivationalMessages = [
  'Buenos días. Hoy es un nuevo día para construir algo grande. ¿Cuál es tu meta?',
  'Enfócate en UNA sola cosa hoy. La multitarea es el enemigo del progreso.',
  'Haz primero lo que estás evitando. Esa tarea incómoda es la que más te hará crecer.',
  'La disciplina supera a la motivación. No esperes estar listo, simplemente empieza.',
  'El progreso pequeño sigue siendo progreso. 1% diario = 37 veces al año.',
  'No negocies contigo mismo. Hiciste un compromiso, cúmplelo.',
  'Recuerda por qué empezaste. Ese objetivo sigue ahí.',
  'El tiempo es tu recurso más valioso. ¿Cómo lo estás invirtiendo hoy?',
  'Los resultados extraordinarios requieren esfuerzo constante, no esfuerzo perfecto.',
  'Sal de tu zona de confort. El crecimiento vive al otro lado del miedo.',
  'No te compares con los demás. Compite con quien eras ayer.',
  'Cada día que practicas es un día más cerca de donde quieres estar.',
  'La perfección es enemiga del progreso. Hecho es mejor que perfecto.',
  'Tu futuro se construye con lo que haces hoy, no mañana.',
  'Si hoy no tienes ganas, hazlo de todas formas. Eso se llama disciplina.',
  'No subes al nivel de tus metas, caes al nivel de tus sistemas.',
  'Deja de esperar el momento perfecto. El momento perfecto es el que tú creas.',
  '¿Cansado? Bien. Significa que estás superando el punto donde la mayoría se detiene.',
  'El éxito no se tiene, se renta — y la renta se paga cada día.',
  'La versión de ti de hace 5 años estaría orgullosa de donde estás. Sigue adelante.',
  'Trabaja duro en silencio. Que los resultados hagan el ruido.',
  'La energía fluye donde va la atención. ¿Qué estás alimentando con tu enfoque hoy?',
  'En un año desearás haber empezado hoy.',
  'Tus hábitos son votos por la persona en que te estás convirtiendo. Elige bien.',
  'No te achiques para encajar en un mundo que no ha alcanzado tu visión.',
  'El dolor de la disciplina pesa gramos. El dolor del arrepentimiento pesa toneladas.',
  'Tienes las mismas 24 horas que todos. Lo que hagas con ellas es tu historia.',
  'Sé la versión de ti mismo en la que tu yo futuro confía.',
  'El impulso se construye en los momentos en que rendirse se siente más fácil.',
  'La comodidad es una muerte lenta. Elige el reto.',
];

export const es = {
  code: 'es',
  name: 'Español',
  commands,
  motivationalMessages,
  responses: {
    motivatePrefix: '¡Aquí tienes un mensaje motivacional! 💪',
    status: '¡El bot está funcionando sin problemas! ✅',
    ping: '¡Pong! 🏓',
    unknown:
      'Lo siento, no entendí ese comando. Escribe *ayuda* para ver los comandos disponibles.',
    langChanged: '🌐 ¡Idioma cambiado a Español!',
    langInvalid: '❌ Idioma inválido. Disponibles: en, es, pt',
  },
};

export type Locale = typeof es;
