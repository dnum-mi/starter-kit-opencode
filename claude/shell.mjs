// Découpe une commande bash comme bash la lit, pour que le hook juge ce qui s'exécute vraiment.
// Chaque morceau rend son texte littéral (guillemets et `\` retirés) et s'il est opaque : un caractère qui
// change ce que bash exécute (expansion, redirection, joker…) que la règle, qui lit le texte, ne verrait pas.
const SEPARATORS = ['&&', '||', '|&', ';', '|', '\n']
// Redirections sans effet sur un fichier, suivies d'un blanc, d'un séparateur ou de la fin : 2>&1, >/dev/null.
const HARMLESS_REDIRECTS = /\d*>>?\s*(?:&\d|\/dev\/null)(?=[\s;&|]|$)/g
const PLAIN_CHAR = /[\w \t./:=@%+,^-]/
// `~` n'est littéral qu'au milieu d'un mot (HEAD~1) ; en tête, bash le remplace par un dossier personnel.
const WORD_CHAR = /[\w.]/
// Entre guillemets doubles, bash interprète encore $, ` et \.
const DOUBLE_QUOTE_SPECIAL = /[$`\\]/
const BLANKS = /\s+/g

function separatorLength(command, i) {
  const separator = SEPARATORS.find(candidate => command.startsWith(candidate, i))
  if (separator)
    return separator.length
  const loneAmpersand = command[i] === '&' && !'<>'.includes(command[i - 1]) && command[i + 1] !== '>'
  return loneAmpersand ? 1 : 0
}

function isPlain(command, i) {
  const char = command[i]
  return PLAIN_CHAR.test(char) || (char === '~' && WORD_CHAR.test(command[i - 1] ?? ''))
}

function newPart() {
  return { literal: '', opaque: false }
}

// Un caractère entre guillemets : rend le guillemet encore ouvert, ou null s'il se ferme.
function readQuoted(part, quote, char) {
  if (char === quote)
    return null
  if (quote === '"' && DOUBLE_QUOTE_SPECIAL.test(char))
    part.opaque = true
  part.literal += char
  return quote
}

// `\` hors guillemets : fin de ligne → continuation ; sinon le caractère suivant, et le morceau devient opaque.
function readEscape(command, i, part) {
  if (command[i + 1] === '\n') {
    part.literal += ' '
    return i + 1
  }
  part.opaque = true
  part.literal += command[i + 1] ?? ''
  return i + 1
}

// Lit le caractère i et rend la position du dernier caractère consommé.
function scanChar(state, command, i) {
  const part = state.parts.at(-1)
  const char = command[i]
  if (state.quote) {
    state.quote = readQuoted(part, state.quote, char)
    return i
  }
  const separator = separatorLength(command, i)
  if (separator) {
    state.parts.push(newPart())
    return i + separator - 1
  }
  if (char === '\\')
    return readEscape(command, i, part)
  if (char === '"' || char === '\'')
    state.quote = char
  else
    part.literal += char
  part.opaque ||= !state.quote && !isPlain(command, i)
  return i
}

function scan(command) {
  const state = { parts: [newPart()], quote: null }
  for (let i = 0; i < command.length; i++)
    i = scanChar(state, command, i)
  // Guillemet jamais fermé : bash refuserait la commande, la règle ne peut pas la juger.
  state.parts.at(-1).opaque ||= state.quote !== null
  return state.parts
}

export function commandParts(command) {
  return scan(command.replace(HARMLESS_REDIRECTS, ''))
    .map(part => ({ ...part, literal: part.literal.replace(BLANKS, ' ').trim() }))
    .filter(part => part.literal)
}
