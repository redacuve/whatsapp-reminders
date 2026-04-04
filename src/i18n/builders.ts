import type { CommandDef, CommandEntry } from '../types.js';

/**
 * Derives the parser-facing commandList from unified command definitions.
 * Output shape: { list: string[], subcommands?: { [key]: { list: string[] } } }
 */
export function buildCommandList(
  defs: Record<string, CommandEntry>,
): Record<string, { list: string[]; subcommands?: Record<string, { list: string[] }> }> {
  return Object.fromEntries(
    Object.entries(defs).map(([key, def]) => [
      key,
      {
        list: def.triggers,
        ...(def.subcommandTriggers && {
          subcommands: Object.fromEntries(
            Object.entries(def.subcommandTriggers).map(([sk, triggers]) => [
              sk,
              { list: triggers },
            ]),
          ),
        }),
      },
    ]),
  );
}

/**
 * Derives the display commands record from unified command definitions.
 * Only includes entries that have a name defined (skips hello, bye, remi, etc.).
 */
export function buildDisplayCommands(
  defs: Record<string, CommandEntry>,
): Record<string, CommandDef> {
  return Object.fromEntries(
    Object.entries(defs)
      .filter(([, def]) => def.name !== undefined)
      .map(([key, def]) => {
        const entry: CommandDef = {
          name: def.name!,
          desc: def.desc ?? '',
          trigger: def.trigger ?? def.triggers[0],
        };
        if (def.emoji !== undefined) entry.emoji = def.emoji;
        if (def.featureName !== undefined) entry.featureName = def.featureName;
        if (def.featureDesc !== undefined) entry.featureDesc = def.featureDesc;
        if (def.helpLines !== undefined) entry.subcommands = def.helpLines;
        return [key, entry];
      }),
  );
}
