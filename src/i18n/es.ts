import { CommandDef, CommandKey } from '../types';

const commands: Record<CommandKey, CommandDef> = {
  help: { name: 'Ayuda', desc: 'Mostrar comandos disponibles' },
  msg: { name: 'Motivar', desc: 'Enviar un mensaje motivacional ahora' },
  status: { name: 'Estado', desc: 'Mostrar estado del bot' },
  ping: { name: 'Ping', desc: 'Responde con pong' },
  lang: {
    name: 'Idioma',
    desc: 'Cambiar tu idioma — lang <código> (en, es, pt)',
  },
  pomodoro: {
    name: 'Pomodoro',
    desc: 'Temporizador pomodoro',
    subcommands: [
      'pomodoro [mins] [tarea] — iniciar (por defecto: 25 min, "Sesión de enfoque")',
      'pomodoro estado — ver temporizador activo',
      'pomodoro cancelar — cancelar temporizador activo',
      'pomodoro ayuda — ver esta lista',
    ],
  },
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
    invalidArgs: '❌ Argumentos inválidos. Revisa el formato del comando.',
    pomodoroStarted: (task: string, mins: number) =>
      `⏱️ ¡Pomodoro iniciado! *${task}* — ${mins} min. Te avisaré cuando termine.`,
    pomodoroDefaultTask: 'Sesión de enfoque',
    pomodoroStart: [
      'Comenzando. Concéntrate y da lo mejor de ti.',
      'Modo enfoque activado. Sin distracciones.',
      'Empieza tu sesión. Una sola cosa a la vez.',
      'A trabajar. Tu yo del futuro te lo agradecerá.',
      'Enfoque total. Apaga notificaciones y adelante.',
      'Sesión iniciada. Ahora mismo no existe nada más.',
      'Blóquea todo. Este es tu tiempo.',
      'El trabajo profundo comienza ya. Házlo valer.',
      'Cada minuto cuenta. Mantén el ritmo.',
      'Sin interrupciones. Solo tú y el trabajo.',
      'Tus metas te esperan. Ve por ellas.',
      'Mente clara, esfuerzo total. Empieza fuerte.',
    ],
    pomodoroEnd: [
      'Listo. Disfruta tu descanso.',
      'Sesión completada. Bien hecho, toma aire.',
      'Terminado. Levántate, estírate y respira.',
      'Tiempo de enfoque terminado. Tómate un momento.',
      'Lo lograste. Descansa y vuelve con más fuerza.',
      'Se acabó el tiempo. Celebra el esfuerzo.',
      'Muy bien. El descanso también es parte del proceso.',
      'Una sesión más. Estás construyendo impulso.',
      'Excelente trabajo. Aléjate y recárgate.',
      'Sólido. Respira, muévete y vuelve.',
      'Sesión terminada. Tu esfuerzo de hoy suma.',
      'Hecho. Tómate el descanso — te lo mereces.',
    ],
    pomodoroAlreadyActive:
      '❌ Ya tienes un pomodoro activo. Termínalo primero.',
    pomodoroNoActive: '❌ No hay ningún pomodoro activo.',
    pomodoroStatus: (task: string, minsLeft: number) =>
      `⏱️ Activo: *${task}* — ${minsLeft} min restantes.`,
    pomodoroCancelled: '✅ Pomodoro cancelado.',
    pomodoroUpdated: (task: string, mins: number) =>
      `🔄 ¡Pomodoro actualizado! *${task}* — ${mins} min restantes.`,
    pomodoroHelpCmd: 'ayuda',
    pomodoroStatusCmd: 'estado',
    pomodoroCancelCmd: 'cancelar',
    pomodoroDone: (task: string) =>
      `✅ ¡Pomodoro terminado! Tiempo cumplido para: *${task}*. ¡Tómate un descanso! 🎉`,
  },
};

export type Locale = typeof es;
