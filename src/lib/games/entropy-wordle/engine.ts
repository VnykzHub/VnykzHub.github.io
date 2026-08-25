/**
 * Entropy Wordle engine: Wordle-compatible colour patterns, information in
 * bits, and an exhaustive entropy solver over a trimmed dictionary. The list
 * is cut to a few hundred common words so the scan runs in a frame; the
 * algorithm is unchanged at full scale, it just wants a worker.
 */

export const WORDS = (
  'crane slate trace crate stare share shore stone store storm sword swore snore scone score spore spare space stack stick stock stuck sting sling swing slime smile smoke snake shake shape sharp shard charm chart cheap cheat check chess chest chief child chill chime china chirp choir choke chord chose chunk cider cigar civic civil claim clamp clash clasp class clean clear clerk click cliff climb cling cloak clock clone close cloth cloud clown coast cocoa colon color comet comic coral couch cough could count court cover crack craft crash crawl cream creek creep crept crime crisp cross crowd crown crude cruel crumb crush crust curve cycle daily dairy dance dated dealt death debut decay decor delay dense depth derby devil diary dirty ditch diver dizzy dodge doing donor doubt dough dozen draft drain drama drank drawn dread dream dress dried drift drill drink drive drove drown eager eagle early earth eight elbow elder elect elite empty enemy enjoy enter entry equal error essay event every exact exist extra fable faith false fancy fatal fault favor feast fence ferry fever fiber field fiery fifth fifty fight final first flame flash fleet flesh flint float flock flood floor flour fluid flush focal focus force forge forth forty forum found frame fraud fresh fried front frost fruit fully funny giant given glass gleam globe glory glove going grace grade grain grand grant grape graph grasp grass grave great greed green greet grief grill grind groan gross group grove guard guess guest guide guilt habit happy harsh haste hatch haunt heart heavy hedge hello hobby honey honor horse hotel house human humor hurry ideal image imply index inner input irony issue ivory joint judge juice known label labor large laser later laugh layer learn lease least leave legal lemon level lever light limit linen liver lobby local lodge logic loose lorry lower loyal lucky lunar lunch lying magic major maker maple march match maybe mayor meant medal media mercy merge merit metal meter midst might minor minus mixed model moist money month moral motor mound mount mouse mouth movie music naked nasty naval nerve never newly night noble noise north noted novel nurse ocean offer often olive onion order organ other ought ounce outer owner paint panel panic paper party pasta patch pause peace peach pearl pedal penny perch peril petty phase phone photo piano piece pilot pinch pitch pivot pixel place plain plane plant plate plaza plead point polar porch pound power press price pride prime print prior prize probe proof proud prove pulse punch pupil purse queen query quest queue quick quiet quite quota radar radio raise rally ranch range rapid ratio reach react ready realm rebel refer reign relax relay renew reply rider ridge rifle right rigid rinse risky rival river roast robot rocky roman rough round route royal rugby ruler rural sadly saint salad sauce scale scare scene scent scope sense serve seven sever shall shell shift shine shirt shock shoot short shown sight silly since sixty skill skirt slack sleep slice slide slope small smart snack solar solid solve sorry sound south spell spend spent spice spike spine spite split spoke sport spray squad staff stage stain stamp stand start state steam steel steep steer stiff still stood stool storm stout strap straw strip study stuff style sugar suite super sweet swift table taken taste teach tempo tenth thank theft their theme there these thick thing think third those three throw thumb tiger tight timer tired title toast today token tooth topic torch total touch tough tower toxic track trade trail train trait trash treat trend trial tribe trick tried troop truck truly trunk trust truth twice twist ultra uncle under union unite unity until upper upset urban usage usual vague valid value vapor vault venue verse video vigil vinyl viral virus visit vital vivid vocal voice voter wagon waist waste watch water weary weird whale wheat wheel where which while white whole whose widow width witch woman world worry worse worth would wound wrist write wrong yield young youth'
)
  .split(' ')
  .filter((w, i, arr) => arr.indexOf(w) === i) // the source list ships one duplicate

/** 0 grey, 1 yellow, 2 green. Wordle-compatible duplicate-letter handling. */
export function pattern(guess: string, answer: string): { code: number; res: number[] } {
  const g = guess.split('')
  const a = answer.split('')
  const res = [0, 0, 0, 0, 0]
  const used = [false, false, false, false, false]
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) {
      res[i] = 2
      used[i] = true
    }
  }
  for (let i = 0; i < 5; i++) {
    if (res[i]) continue
    for (let j = 0; j < 5; j++) {
      if (!used[j] && g[i] === a[j]) {
        res[i] = 1
        used[j] = true
        break
      }
    }
  }
  let code = 0
  for (let i = 0; i < 5; i++) code = code * 3 + res[i]
  return { code, res }
}

/** Expected information (bits) of a guess across the candidate set. */
export function entropyOf(guess: string, cands: string[]): number {
  const buckets = new Map<number, number>()
  for (const w of cands) {
    const code = pattern(guess, w).code
    buckets.set(code, (buckets.get(code) || 0) + 1)
  }
  let h = 0
  const n = cands.length
  buckets.forEach((v) => {
    const p = v / n
    h -= p * Math.log2(p)
  })
  return h
}

/** The max-entropy word over the candidate set (candidates-only near the end). */
export function bestGuess(cands: string[]): { word: string; bits: number } {
  let best: string | null = null
  let bh = -1
  const pool = cands.length <= 2 ? cands : WORDS
  for (const w of pool) {
    const h = entropyOf(w, cands)
    if (h > bh || (h === bh && cands.includes(w) && (best === null || !cands.includes(best)))) {
      bh = h
      best = w
    }
  }
  return { word: best ?? pool[0], bits: bh }
}
