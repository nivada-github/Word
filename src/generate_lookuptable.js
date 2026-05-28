#!/usr/bin/env node
/**
 * Generates data/lookuptable.json — a flat word→root mapping.
 * Uses words-reduced.json as input, maps to roots from root_words.json.
 *
 * NO letter-based heuristics. Every mapping is based on:
 * 1. Hand-curated base words (Layer 1)
 * 2. Morphological derivation from base words (Layer 2)
 * 3. Etymological stem/morpheme matching (Layer 3)
 *
 * Usage: node src/generate_lookuptable.js
 */

const fs = require("fs");
const path = require("path");

const WORDS_PATH = path.join(__dirname, "..", "data", "words-reduced.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "lookuptable.json");

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key) && Array.isArray(obj[key]);
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1: Hand-curated base dictionary  word → [root]
// Every entry here is a word I've thought about: what does it truly mean,
// where did it come from, which root does it belong to?
// ─────────────────────────────────────────────────────────────────────────────

const BASE = {
  // nu — primordial waters, chaos, potential, newness, void
  "new":["nu"],"nova":["nu"],"novel":["nu"],"novice":["nu"],"null":["nu"],"nude":["nu"],
  "nucleus":["nu"],"numb":["nu"],"night":["nu"],"nothing":["nu"],"naught":["nu"],
  "nebula":["nu"],"neutral":["nu"],"negate":["nu"],"never":["nu"],"nihil":["nu"],
  "empty":["nu"],"blank":["nu"],"bare":["nu"],"vacant":["nu"],"abyss":["nu"],
  "chaos":["nu"],"void":["nu"],"zero":["nu"],"nought":["nu"],"naive":["nu"],
  "innovate":["nu"],"renew":["nu"],"noir":["nu"],"obscure":["nu"],"oblivion":["nu"],

  // ra — radiance, source light, illumination, reason
  "ray":["ra"],"radiant":["ra"],"radiate":["ra"],"radiation":["ra"],"radius":["ra"],
  "radio":["ra"],"ratio":["ra"],"dawn":["ra"],"day":["ra"],"noon":["ra"],
  "sun":["ra"],"star":["ra"],"bright":["ra"],"brilliant":["ra"],"beam":["ra"],
  "gleam":["ra"],"glare":["ra"],"shimmer":["ra"],"sparkle":["ra"],"twinkle":["ra"],
  "blaze":["ra"],"glow":["ra"],"luminous":["ra"],"reason":["ra"],"rational":["ra"],

  // ka — vital force, animating energy, calling, caring
  "call":["ka"],"cause":["ka"],"care":["ka"],"energy":["ka"],"power":["ka"],
  "force":["ka"],"love":["ka"],"free":["ka"],"freedom":["ka"],"god":["ka"],
  "alive":["ka"],"animate":["ka"],"keen":["ka"],"quick":["ka"],"vigor":["ka"],
  "vital":["ka"],"vivid":["ka"],"excite":["ka"],"charm":["ka"],"desire":["ka"],
  "passion":["ka"],"zest":["ka"],"thrive":["ka"],"spirit":["ka"],"soul":["ka"],
  "aura":["ka"],"inspire":["ka"],"aspire":["ka"],"enthusiasm":["ka"],"fervor":["ka"],

  // ba — being, existence, becoming, soul in motion
  "be":["ba"],"being":["ba"],"become":["ba"],"born":["ba"],"exist":["ba"],
  "am":["ba"],"is":["ba"],"are":["ba"],"was":["ba"],"were":["ba"],"been":["ba"],
  "presence":["ba"],"present":["ba"],"absence":["ba"],"absent":["ba"],
  "entity":["ba"],"yes":["ba"],"essential":["ba"],"ontology":["ba"],

  // ankh — life, union, binding, knots
  "anchor":["ankh"],"angle":["ankh"],"ankle":["ankh"],"link":["ankh"],"knot":["ankh"],
  "life":["ankh"],"live":["ankh"],"survive":["ankh"],"bind":["ankh"],"bond":["ankh"],
  "join":["ankh"],"knit":["ankh"],"tie":["ankh"],"yoke":["ankh"],"couple":["ankh"],
  "marry":["ankh"],"wed":["ankh"],"attach":["ankh"],"clasp":["ankh"],"lace":["ankh"],
  "alive":["ankh"],"revive":["ankh"],"biology":["ankh"],"vital":["ankh"],

  // ma — mother, matter, making, measuring, nourishment
  "mother":["ma"],"matter":["ma"],"matrix":["ma"],"math":["ma"],"measure":["ma"],
  "material":["ma"],"mature":["ma"],"make":["ma"],"meal":["ma"],"food":["ma"],
  "feed":["ma"],"nourish":["ma"],"nurture":["ma"],"nurse":["ma"],"mass":["ma"],
  "massive":["ma"],"amount":["ma"],"map":["ma"],"mold":["ma"],"model":["ma"],
  "manufacture":["ma"],"harvest":["ma"],"mama":["ma"],"mammoth":["ma"],

  // pa — father, path, opening, expansion, going forth
  "father":["pa"],"path":["pa"],"pass":["pa"],"pan":["pa"],"pace":["pa"],
  "page":["pa"],"part":["pa"],"open":["pa"],"passage":["pa"],"past":["pa"],
  "foot":["pa"],"step":["pa"],"walk":["pa"],"wander":["pa"],"expand":["pa"],
  "explore":["pa"],"follow":["pa"],"fly":["pa"],"far":["pa"],"depart":["pa"],
  "separate":["pa"],"pattern":["pa"],"ancestor":["pa"],"papa":["pa"],
  "patrol":["pa"],"passport":["pa"],"pedestrian":["pa"],

  // khpr — transformation, becoming, shaping, creating
  "shape":["khpr"],"shift":["khpr"],"change":["khpr"],"chapter":["khpr"],
  "create":["khpr"],"transform":["khpr"],"form":["khpr"],"reform":["khpr"],
  "evolve":["khpr"],"develop":["khpr"],"morph":["khpr"],"alter":["khpr"],
  "adapt":["khpr"],"fashion":["khpr"],"sculpt":["khpr"],"modify":["khpr"],
  "adjust":["khpr"],"vary":["khpr"],"mutate":["khpr"],"metamorphosis":["khpr"],
  "convert":["khpr"],"craft":["khpr"],"design":["khpr"],"invent":["khpr"],

  // djd — stability, endurance, backbone, structure
  "stand":["djd"],"steady":["djd"],"structure":["djd"],"pillar":["djd"],
  "strong":["djd"],"strength":["djd"],"stem":["djd"],"stiff":["djd"],
  "stubborn":["djd"],"spine":["djd"],"column":["djd"],"post":["djd"],
  "pole":["djd"],"rigid":["djd"],"fast":["djd"],"fasten":["djd"],
  "secure":["djd"],"permanent":["djd"],"durable":["djd"],"robust":["djd"],
  "skeleton":["djd"],"frame":["djd"],"foundation":["djd"],"scaffold":["djd"],

  // maat — truth, cosmic order, justice, balance
  "balance":["maat"],"match":["maat"],"metric":["maat"],"moderate":["maat"],
  "equal":["maat"],"even":["maat"],"judge":["maat"],"judgment":["maat"],
  "peace":["maat"],"calm":["maat"],"quiet":["maat"],"honor":["maat"],
  "integrity":["maat"],"harmony":["maat"],"symmetry":["maat"],
  "proportion":["maat"],"poise":["maat"],"temperate":["maat"],"equitable":["maat"],

  // ir — eye, seeing, perception, vision, awareness
  "eye":["ir"],"idea":["ir"],"iris":["ir"],"image":["ir"],"vision":["ir"],
  "imagine":["ir"],"see":["ir"],"look":["ir"],"watch":["ir"],"view":["ir"],
  "sight":["ir"],"perceive":["ir"],"observe":["ir"],"discover":["ir"],
  "reveal":["ir"],"dream":["ir"],"wake":["ir"],"woke":["ir"],"awake":["ir"],
  "aware":["ir"],"alert":["ir"],"face":["ir"],"mirror":["ir"],"gaze":["ir"],
  "stare":["ir"],"glance":["ir"],"peek":["ir"],"spy":["ir"],"inspect":["ir"],
  "notice":["ir"],"recognize":["ir"],"witness":["ir"],"envision":["ir"],
  "foresee":["ir"],"insight":["ir"],"visible":["ir"],"evident":["ir"],
  "obvious":["ir"],"scope":["ir"],"microscope":["ir"],"telescope":["ir"],

  // wr — magnitude, greatness, worth, work, world
  "war":["wr"],"word":["wr"],"world":["wr"],"worth":["wr"],"work":["wr"],
  "warrior":["wr"],"value":["wr"],"worship":["wr"],"worthy":["wr"],
  "wonder":["wr"],"worry":["wr"],"wrath":["wr"],"wrestle":["wr"],
  "wreck":["wr"],"wealth":["wr"],"wage":["wr"],

  // nfr — beauty, perfection, completion, goodness, pleasure
  "fine":["nfr"],"finish":["nfr"],"refine":["nfr"],"perfect":["nfr"],
  "beauty":["nfr"],"beautiful":["nfr"],"pretty":["nfr"],"lovely":["nfr"],
  "elegant":["nfr"],"grace":["nfr"],"graceful":["nfr"],"good":["nfr"],
  "nice":["nfr"],"joy":["nfr"],"enjoy":["nfr"],"pleasure":["nfr"],
  "delight":["nfr"],"happy":["nfr"],"glad":["nfr"],"content":["nfr"],
  "satisfy":["nfr"],"splendid":["nfr"],"glorious":["nfr"],
  "sad":["nfr"],"sweet":["nfr"],"wonderful":["nfr"],

  // rn — name, identity, knowing, fame
  "name":["rn"],"noun":["rn"],"know":["rn"],"knowledge":["rn"],
  "narrate":["rn"],"rename":["rn"],"noble":["rn"],"note":["rn"],
  "notify":["rn"],"notorious":["rn"],"fame":["rn"],"famous":["rn"],
  "brand":["rn"],"label":["rn"],"title":["rn"],"identity":["rn"],
  "identify":["rn"],"tell":["rn"],"announce":["rn"],"declare":["rn"],
  "pronounce":["rn"],"acknowledge":["rn"],"nominate":["rn"],

  // hk — magic, spell, enchantment, utterance-as-power
  "hex":["hk"],"hack":["hk"],"enchant":["hk"],"incantation":["hk"],
  "magic":["hk"],"spell":["hk"],"witch":["hk"],"wizard":["hk"],
  "sorcery":["hk"],"curse":["hk"],"bewitch":["hk"],"alchemy":["hk"],
  "ritual":["hk"],"talisman":["hk"],"amulet":["hk"],"occult":["hk"],
  "mystic":["hk"],"mysterious":["hk"],

  // pr — house, going forth, producing, protecting
  "prior":["pr"],"produce":["pr"],"project":["pr"],"protect":["pr"],
  "prove":["pr"],"per":["pr"],"provide":["pr"],"process":["pr"],
  "proceed":["pr"],"progress":["pr"],"promise":["pr"],"propose":["pr"],
  "purpose":["pr"],"prevent":["pr"],"prepare":["pr"],"preserve":["pr"],
  "profit":["pr"],"promote":["pr"],"program":["pr"],"problem":["pr"],
  "hero":["pr"],"shelter":["pr"],"guard":["pr"],"prophet":["pr"],

  // sdm — hearing, listening, sound, sensing, reception
  "sound":["sdm"],"sense":["sdm"],"heed":["sdm"],"listen":["sdm"],
  "understand":["sdm"],"ear":["sdm"],"hear":["sdm"],"feel":["sdm"],
  "attention":["sdm"],"attend":["sdm"],"obey":["sdm"],"echo":["sdm"],
  "noise":["sdm"],"tone":["sdm"],"tune":["sdm"],"music":["sdm"],
  "melody":["sdm"],"rhythm":["sdm"],"acoustic":["sdm"],"resound":["sdm"],
  "silent":["sdm"],"loud":["sdm"],"murmur":["sdm"],"whisper":["sdm"],

  // wdj — wholeness, soundness, flourishing, well-being
  "whole":["wdj"],"heal":["wdj"],"health":["wdj"],"holy":["wdj"],
  "hale":["wdj"],"welfare":["wdj"],"well":["wdj"],"wellness":["wdj"],
  "wholesome":["wdj"],"flourish":["wdj"],"prosper":["wdj"],
  "bloom":["wdj"],"blossom":["wdj"],"thrive":["wdj"],

  // aleph — ox, primal strength, all, totality
  "alpha":["aleph"],"all":["aleph"],"also":["aleph"],"always":["aleph"],
  "already":["aleph"],"altogether":["aleph"],"almighty":["aleph"],
  "almost":["aleph"],"alone":["aleph"],"absolute":["aleph"],

  // beth — house, container, body, dwelling
  "body":["beth"],"build":["beth"],"both":["beth"],"house":["beth"],
  "home":["beth"],"room":["beth"],"bed":["beth"],"nest":["beth"],
  "dwell":["beth"],"shell":["beth"],"box":["beth"],"case":["beth"],
  "cabin":["beth"],"cottage":["beth"],"castle":["beth"],"palace":["beth"],
  "temple":["beth"],"church":["beth"],"chamber":["beth"],"cell":["beth"],
  "womb":["beth"],"tomb":["beth"],"flesh":["beth"],"skin":["beth"],
  "coat":["beth"],"bag":["beth"],"bottle":["beth"],"barrel":["beth"],
  "basket":["beth"],"bowl":["beth"],"pot":["beth"],"jar":["beth"],
  "cup":["beth"],"barn":["beth"],"den":["beth"],"cave":["beth"],
  "burrow":["beth"],"harbor":["beth"],"port":["beth"],"envelope":["beth"],
  "contain":["beth"],"include":["beth"],"capsule":["beth"],"cocoon":["beth"],

  // gimel — carrying across, journey, transport, movement
  "camel":["gimel"],"carry":["gimel"],"go":["gimel"],"game":["gimel"],
  "come":["gimel"],"journey":["gimel"],"travel":["gimel"],"trip":["gimel"],
  "road":["gimel"],"bridge":["gimel"],"cross":["gimel"],"trade":["gimel"],
  "traffic":["gimel"],"transport":["gimel"],"transit":["gimel"],
  "migrate":["gimel"],"move":["gimel"],"roam":["gimel"],"race":["gimel"],
  "run":["gimel"],"ride":["gimel"],"drive":["gimel"],"vehicle":["gimel"],
  "wagon":["gimel"],"cart":["gimel"],"ship":["gimel"],"boat":["gimel"],
  "sail":["gimel"],"swim":["gimel"],"navigate":["gimel"],

  // daleth — door, threshold, gateway, division
  "door":["daleth"],"deal":["daleth"],"divide":["daleth"],"delta":["daleth"],
  "gate":["daleth"],"key":["daleth"],"hole":["daleth"],"enter":["daleth"],
  "exit":["daleth"],"escape":["daleth"],"portal":["daleth"],"gap":["daleth"],
  "lock":["daleth"],"threshold":["daleth"],"window":["daleth"],"mouth":["daleth"],

  // he — window, breath, beholding, heaven, hope
  "he":["he"],"here":["he"],"behold":["he"],"heaven":["he"],"hope":["he"],
  "her":["he"],"him":["he"],"his":["he"],"hello":["he"],"hail":["he"],

  // vav — hook, connection, conjunction, fastening
  "with":["vav"],"and":["vav"],"vine":["vav"],"weave":["vav"],
  "wire":["vav"],"web":["vav"],"weld":["vav"],"sew":["vav"],
  "stitch":["vav"],"nail":["vav"],"hook":["vav"],"clip":["vav"],
  "pin":["vav"],"clasp":["vav"],"buckle":["vav"],"button":["vav"],
  "zipper":["vav"],"glue":["vav"],"tape":["vav"],"braid":["vav"],
  "chain":["vav"],"rope":["vav"],"string":["vav"],"thread":["vav"],
  "fiber":["vav"],"knit":["vav"],

  // zayin — weapon, blade, cutting, plow, discernment
  "zone":["zayin"],"zeal":["zayin"],"sword":["zayin"],"blade":["zayin"],
  "knife":["zayin"],"axe":["zayin"],"razor":["zayin"],"scythe":["zayin"],
  "scissors":["zayin"],"plow":["zayin"],"cut":["zayin"],"slice":["zayin"],
  "chop":["zayin"],"shear":["zayin"],"trim":["zayin"],"carve":["zayin"],
  "split":["zayin"],"sever":["zayin"],"cleave":["zayin"],"reap":["zayin"],
  "mow":["zayin"],"sharp":["zayin"],"edge":["zayin"],"point":["zayin"],

  // teth — serpent, wheel, time, turning, cycle
  "time":["teth"],"turn":["teth"],"twist":["teth"],"theta":["teth"],
  "tide":["teth"],"season":["teth"],"wheel":["teth"],"coil":["teth"],
  "spiral":["teth"],"spin":["teth"],"swirl":["teth"],"rotate":["teth"],
  "revolve":["teth"],"roll":["teth"],"ring":["teth"],"round":["teth"],
  "orbit":["teth"],"clock":["teth"],"hour":["teth"],"minute":["teth"],
  "second":["teth"],"age":["teth"],"era":["teth"],"eternal":["teth"],
  "ancient":["teth"],"year":["teth"],"month":["teth"],"week":["teth"],
  "century":["teth"],"period":["teth"],"moment":["teth"],"date":["teth"],
  "calendar":["teth"],"cycle":["teth"],"circle":["teth"],"spring":["teth"],
  "summer":["teth"],"autumn":["teth"],"winter":["teth"],

  // yod — hand, agency, doing, action, will
  "hand":["yod"],"act":["yod"],"action":["yod"],"active":["yod"],
  "agent":["yod"],"do":["yod"],"done":["yod"],"deed":["yod"],
  "fact":["yod"],"art":["yod"],"skill":["yod"],"touch":["yod"],
  "hold":["yod"],"grip":["yod"],"grab":["yod"],"reach":["yod"],
  "finger":["yod"],"thumb":["yod"],"fist":["yod"],"palm":["yod"],
  "wrist":["yod"],"write":["yod"],"draw":["yod"],"scratch":["yod"],
  "use":["yod"],"tool":["yod"],"handle":["yod"],"wield":["yod"],
  "will":["yod"],"wish":["yod"],"effort":["yod"],"try":["yod"],
  "practice":["yod"],"work":["yod"],"labor":["yod"],"toil":["yod"],

  // kaph — palm, open hand, grasping, giving, receiving
  "grasp":["kaph"],"give":["kaph"],"gift":["kaph"],"receive":["kaph"],
  "accept":["kaph"],"gather":["kaph"],"catch":["kaph"],"capture":["kaph"],
  "take":["kaph"],"seize":["kaph"],"pick":["kaph"],"collect":["kaph"],
  "forgive":["kaph"],"offer":["kaph"],"share":["kaph"],"lend":["kaph"],
  "borrow":["kaph"],"steal":["kaph"],"rob":["kaph"],"keep":["kaph"],
  "cap":["kaph"],"cup":["kaph"],

  // lamed — goad, teaching, leading, law, learning
  "learn":["lamed"],"lead":["lamed"],"law":["lamed"],"lesson":["lamed"],
  "teach":["lamed"],"guide":["lamed"],"school":["lamed"],"student":["lamed"],
  "study":["lamed"],"educate":["lamed"],"instruct":["lamed"],"train":["lamed"],
  "coach":["lamed"],"mentor":["lamed"],"tutor":["lamed"],"discipline":["lamed"],
  "rule":["lamed"],"govern":["lamed"],"direct":["lamed"],"command":["lamed"],
  "order":["lamed"],"correct":["lamed"],"lecture":["lamed"],

  // mem — water, flow, emotion, memory, movement
  "memory":["mem"],"mind":["mem"],"emotion":["mem"],"motion":["mem"],
  "rain":["mem"],"river":["mem"],"stream":["mem"],"flow":["mem"],
  "flood":["mem"],"pour":["mem"],"drip":["mem"],"leak":["mem"],
  "spill":["mem"],"drown":["mem"],"soak":["mem"],"drench":["mem"],
  "marsh":["mem"],"swamp":["mem"],"dew":["mem"],"mist":["mem"],
  "fog":["mem"],"cloud":["mem"],"vapor":["mem"],"humid":["mem"],
  "moisture":["mem"],"blood":["mem"],"sweat":["mem"],"sap":["mem"],
  "juice":["mem"],"tears":["mem"],"melt":["mem"],

  // nun — fish, seed, birth, nation, nature, propagation
  "nine":["nun"],"natal":["nun"],"nation":["nun"],"nature":["nun"],
  "natural":["nun"],"native":["nun"],"innate":["nun"],"nascent":["nun"],
  "fish":["nun"],"seed":["nun"],"egg":["nun"],"gene":["nun"],
  "breed":["nun"],"spawn":["nun"],"embryo":["nun"],"infant":["nun"],
  "baby":["nun"],"child":["nun"],"offspring":["nun"],"descendant":["nun"],
  "generation":["nun"],"pregnant":["nun"],"fertile":["nun"],
  "genetic":["nun"],"genome":["nun"],

  // samekh — support, prop, sustaining, helping
  "support":["samekh"],"sustain":["samekh"],"system":["samekh"],
  "help":["samekh"],"assist":["samekh"],"aid":["samekh"],"rely":["samekh"],
  "depend":["samekh"],"lean":["samekh"],"prop":["samekh"],"brace":["samekh"],
  "scaffold":["samekh"],"crutch":["samekh"],"comfort":["samekh"],
  "maintain":["samekh"],"uphold":["samekh"],"bone":["samekh"],
  "backbone":["samekh"],"base":["samekh"],"defend":["samekh"],

  // ayin — eye, spring, source, origin, wellspring
  "origin":["ayin"],"source":["ayin"],"fountain":["ayin"],"begin":["ayin"],
  "original":["ayin"],"start":["ayin"],"spring":["ayin"],"well":["ayin"],

  // pe — mouth, utterance, speech, voice, expression
  "speak":["pe"],"phone":["pe"],"phrase":["pe"],"voice":["pe"],
  "say":["pe"],"talk":["pe"],"speech":["pe"],"tongue":["pe"],
  "sing":["pe"],"song":["pe"],"shout":["pe"],"scream":["pe"],
  "yell":["pe"],"cry":["pe"],"whisper":["pe"],"chant":["pe"],
  "pray":["pe"],"recite":["pe"],"quote":["pe"],"utter":["pe"],
  "express":["pe"],"claim":["pe"],"vow":["pe"],"swear":["pe"],
  "language":["pe"],"lip":["pe"],"breath":["pe"],"laugh":["pe"],
  "smile":["pe"],"eat":["pe"],"taste":["pe"],"bite":["pe"],
  "chew":["pe"],"swallow":["pe"],"spit":["pe"],"kiss":["pe"],

  // tsade — fishhook, righteousness, justice, conscience
  "just":["tsade"],"justice":["tsade"],"righteous":["tsade"],"right":["tsade"],
  "honest":["tsade"],"fair":["tsade"],"conscience":["tsade"],"moral":["tsade"],
  "ethic":["tsade"],"guilt":["tsade"],"innocent":["tsade"],"sin":["tsade"],
  "virtue":["tsade"],"punish":["tsade"],"reward":["tsade"],"deserve":["tsade"],

  // qoph — circuit, cycle, quest, question, return
  "quest":["qoph"],"question":["qoph"],"search":["qoph"],"seek":["qoph"],
  "ask":["qoph"],"answer":["qoph"],"reply":["qoph"],"respond":["qoph"],
  "return":["qoph"],"repeat":["qoph"],"again":["qoph"],"restore":["qoph"],
  "recover":["qoph"],"recur":["qoph"],"review":["qoph"],"research":["qoph"],

  // resh — head, beginning, chief, ruler, summit
  "head":["resh"],"chief":["resh"],"captain":["resh"],"boss":["resh"],
  "leader":["resh"],"president":["resh"],"principal":["resh"],"primary":["resh"],
  "prime":["resh"],"first":["resh"],"top":["resh"],"summit":["resh"],
  "peak":["resh"],"crown":["resh"],"throne":["resh"],"king":["resh"],
  "queen":["resh"],"royal":["resh"],"regal":["resh"],"reign":["resh"],

  // shin — tooth, fire, burning, consuming, shining
  "shine":["shin"],"fire":["shin"],"flame":["shin"],"burn":["shin"],
  "spark":["shin"],"ember":["shin"],"ash":["shin"],"smoke":["shin"],
  "heat":["shin"],"hot":["shin"],"warm":["shin"],"boil":["shin"],
  "cook":["shin"],"bake":["shin"],"roast":["shin"],"forge":["shin"],
  "smelt":["shin"],"ignite":["shin"],"kindle":["shin"],"torch":["shin"],
  "candle":["shin"],"lamp":["shin"],"light":["shin"],"tooth":["shin"],
  "fang":["shin"],"devour":["shin"],"consume":["shin"],"destroy":["shin"],
  "purify":["shin"],"pure":["shin"],"show":["shin"],

  // tav — mark, sign, completion, writing, ending
  "tag":["tav"],"token":["tav"],"total":["tav"],"mark":["tav"],
  "sign":["tav"],"signal":["tav"],"symbol":["tav"],"seal":["tav"],
  "stamp":["tav"],"print":["tav"],"write":["tav"],"letter":["tav"],
  "inscribe":["tav"],"script":["tav"],"score":["tav"],"tally":["tav"],
  "count":["tav"],"signature":["tav"],"dot":["tav"],"trace":["tav"],
  "track":["tav"],"scar":["tav"],"tattoo":["tav"],"flag":["tav"],
  "badge":["tav"],"logo":["tav"],"check":["tav"],"end":["tav"],
  "final":["tav"],"last":["tav"],"conclude":["tav"],"death":["tav"],
  "close":["tav"],"complete":["tav"],

  // om — primordial vibration, totality, home, resonance
  "omni":["om"],"omen":["om"],"home":["om"],"ohm":["om"],
  "harmony":["om"],"hum":["om"],"chime":["om"],"vibrate":["om"],
  "frequency":["om"],"sonic":["om"],

  // sat — being, truth, what is real, satisfaction
  "sooth":["sat"],"real":["sat"],"reality":["sat"],"truth":["sat"],
  "true":["sat"],"authentic":["sat"],"actual":["sat"],"sincere":["sat"],
  "certain":["sat"],"sure":["sat"],"soothe":["sat"],"essence":["sat"],

  // vid — seeing, knowing, wisdom, evidence
  "video":["vid"],"wisdom":["vid"],"wit":["vid"],"wise":["vid"],
  "advise":["vid"],"supervise":["vid"],"provide":["vid"],"envy":["vid"],
  "history":["vid"],"story":["vid"],"evident":["vid"],

  // gen — birth, generation, kind, genesis
  "generate":["gen"],"genesis":["gen"],"genius":["gen"],"genre":["gen"],
  "gentle":["gen"],"genuine":["gen"],"kin":["gen"],"kind":["gen"],
  "parent":["gen"],"son":["gen"],"daughter":["gen"],"brother":["gen"],
  "sister":["gen"],"tribe":["gen"],"species":["gen"],"family":["gen"],
  "grow":["gen"],"growth":["gen"],"plant":["gen"],"fruit":["gen"],
  "creature":["gen"],"young":["gen"],"youth":["gen"],"old":["gen"],
  "heir":["gen"],"legacy":["gen"],"organic":["gen"],

  // sta — standing, state, station, stability
  "state":["sta"],"station":["sta"],"static":["sta"],"stay":["sta"],
  "stone":["sta"],"store":["sta"],"still":["sta"],"status":["sta"],
  "establish":["sta"],"constant":["sta"],"persist":["sta"],"resist":["sta"],
  "insist":["sta"],"consist":["sta"],"distance":["sta"],"instant":["sta"],
  "substance":["sta"],"obstacle":["sta"],"standard":["sta"],"statue":["sta"],
  "stature":["sta"],"stable":["sta"],"steadfast":["sta"],

  // bhr — bearing, carrying, bringing, birthing, enduring
  "bear":["bhr"],"birth":["bhr"],"bring":["bhr"],"burden":["bhr"],
  "transfer":["bhr"],"suffer":["bhr"],"defer":["bhr"],"refer":["bhr"],
  "prefer":["bhr"],"confer":["bhr"],"infer":["bhr"],"differ":["bhr"],
  "ferry":["bhr"],"freight":["bhr"],"cargo":["bhr"],"load":["bhr"],
  "haul":["bhr"],"lift":["bhr"],"raise":["bhr"],"shoulder":["bhr"],
  "patient":["bhr"],"endure":["bhr"],"tolerate":["bhr"],"portable":["bhr"],

  // vrt — turning, revolving, vortex, conversion, verse
  "vortex":["vrt"],"verse":["vrt"],"version":["vrt"],"revert":["vrt"],
  "universe":["vrt"],"reverse":["vrt"],"divert":["vrt"],"invert":["vrt"],
  "controversial":["vrt"],"versatile":["vrt"],"anniversary":["vrt"],
  "adverse":["vrt"],"conversation":["vrt"],"about":["vrt"],"around":["vrt"],
  "dance":["vrt"],"tornado":["vrt"],"whirl":["vrt"],"wring":["vrt"],
  "screw":["vrt"],

  // dhr — holding firm, dharma, truth-as-firmness, tree, trust
  "firm":["dhr"],"tree":["dhr"],"trust":["dhr"],"faith":["dhr"],
  "believe":["dhr"],"root":["dhr"],"deep":["dhr"],"ground":["dhr"],
  "floor":["dhr"],"forest":["dhr"],"timber":["dhr"],"oak":["dhr"],
  "wood":["dhr"],"log":["dhr"],"plank":["dhr"],"board":["dhr"],
  "loyal":["dhr"],"faithful":["dhr"],"reliable":["dhr"],
  "determined":["dhr"],"resolve":["dhr"],

  // spi — breath, spiral, spirit, aspiration
  "breathe":["spi"],"air":["spi"],"wind":["spi"],"atmosphere":["spi"],
  "oxygen":["spi"],"inhale":["spi"],"exhale":["spi"],"gasp":["spi"],
  "sigh":["spi"],"pant":["spi"],"snore":["spi"],"yawn":["spi"],
  "wheeze":["spi"],"ghost":["spi"],"psyche":["spi"],"angel":["spi"],
  "demon":["spi"],"expire":["spi"],"conspire":["spi"],"respire":["spi"],

  // sol — sun, wholeness, solitude, solving
  "solar":["sol"],"sole":["sol"],"solid":["sol"],"solo":["sol"],
  "solve":["sol"],"console":["sol"],"only":["sol"],"single":["sol"],
  "unique":["sol"],"individual":["sol"],"private":["sol"],"personal":["sol"],
  "self":["sol"],"lonely":["sol"],"solitary":["sol"],"solitude":["sol"],
  "isolate":["sol"],"solution":["sol"],"dissolve":["sol"],

  // lux — light, illumination, clarity, color
  "lucid":["lux"],"illustrate":["lux"],"lunar":["lux"],"luxury":["lux"],
  "glass":["lux"],"gold":["lux"],"silver":["lux"],"clean":["lux"],
  "clear":["lux"],"dazzle":["lux"],"flash":["lux"],"flicker":["lux"],
  "glitter":["lux"],"illuminate":["lux"],"radiance":["lux"],"sheen":["lux"],
  "gloss":["lux"],"polish":["lux"],"color":["lux"],"white":["lux"],
  "pale":["lux"],"dark":["lux"],"shadow":["lux"],"dim":["lux"],"blind":["lux"],

  // ter — earth, ground, territory, terrain
  "earth":["ter"],"terra":["ter"],"territory":["ter"],"terrain":["ter"],
  "term":["ter"],"external":["ter"],"land":["ter"],"soil":["ter"],
  "dirt":["ter"],"mud":["ter"],"clay":["ter"],"sand":["ter"],
  "dust":["ter"],"rock":["ter"],"mountain":["ter"],"hill":["ter"],
  "valley":["ter"],"plain":["ter"],"field":["ter"],"meadow":["ter"],
  "desert":["ter"],"island":["ter"],"continent":["ter"],"farm":["ter"],
  "garden":["ter"],"acre":["ter"],"country":["ter"],"grave":["ter"],
  "bury":["ter"],"dig":["ter"],"mine":["ter"],"tunnel":["ter"],

  // aq — water, flow, washing, aquatic
  "water":["aq"],"aqua":["aq"],"wash":["aq"],"wave":["aq"],
  "wet":["aq"],"sea":["aq"],"ocean":["aq"],"lake":["aq"],
  "pond":["aq"],"pool":["aq"],"creek":["aq"],"brook":["aq"],
  "canal":["aq"],"drain":["aq"],"ice":["aq"],"frost":["aq"],
  "freeze":["aq"],"steam":["aq"],"splash":["aq"],"spray":["aq"],
  "float":["aq"],"sink":["aq"],"dive":["aq"],"wade":["aq"],
  "drink":["aq"],"thirst":["aq"],"liquid":["aq"],"fluid":["aq"],
  "current":["aq"],"waterfall":["aq"],"dam":["aq"],"bath":["aq"],
  "shower":["aq"],"snow":["aq"],

  // cor — heart, core, courage, feeling
  "core":["cor"],"courage":["cor"],"heart":["cor"],"accord":["cor"],
  "record":["cor"],"cardiac":["cor"],"brave":["cor"],"agree":["cor"],
  "discord":["cor"],"encourage":["cor"],"cordial":["cor"],"mercy":["cor"],
  "compassion":["cor"],"sympathy":["cor"],"empathy":["cor"],
  "affection":["cor"],"sentiment":["cor"],

  // mns — mind, thought, measuring, mental
  "mental":["mns"],"brain":["mns"],"think":["mns"],"thought":["mns"],
  "concept":["mns"],"ponder":["mns"],"consider":["mns"],"reflect":["mns"],
  "doubt":["mns"],"opinion":["mns"],"decide":["mns"],"plan":["mns"],
  "comprehend":["mns"],"concentrate":["mns"],"focus":["mns"],
  "conscious":["mns"],"intelligence":["mns"],"clever":["mns"],"smart":["mns"],
  "stupid":["mns"],"confused":["mns"],"forget":["mns"],"remember":["mns"],
  "mad":["mns"],"sane":["mns"],"crazy":["mns"],"logic":["mns"],
  "analyze":["mns"],"calculate":["mns"],"number":["mns"],"dimension":["mns"],

  // ver — truth, spring, verification, verdancy
  "verify":["ver"],"very":["ver"],"verdict":["ver"],"verdant":["ver"],

  // reg — rule, straight line, direction, regulation
  "regulate":["reg"],"region":["reg"],"regime":["reg"],
  "regular":["reg"],"irregular":["reg"],"rectangle":["reg"],"direction":["reg"],
  "erect":["reg"],

  // nod — knot, node, connection, network, nexus
  "node":["nod"],"net":["nod"],"nexus":["nod"],"connect":["nod"],
  "network":["nod"],"internet":["nod"],"tangle":["nod"],"entangle":["nod"],
  "puzzle":["nod"],"annotate":["nod"],

  // web — weaving, fabric, textile, interconnection
  "fabric":["web"],"textile":["web"],"cloth":["web"],"loom":["web"],
  "tapestry":["web"],"carpet":["web"],"rug":["web"],"silk":["web"],
  "cotton":["web"],"wool":["web"],"linen":["web"],

  // pul — pushing, pulling, pulse, driving, compelling
  "pulse":["pul"],"push":["pul"],"pull":["pul"],"impulse":["pul"],
  "compel":["pul"],"propel":["pul"],"appeal":["pul"],"expel":["pul"],
  "repel":["pul"],"dispel":["pul"],"impel":["pul"],"press":["pul"],
  "pressure":["pul"],"compress":["pul"],"thrust":["pul"],"shove":["pul"],
  "eject":["pul"],"inject":["pul"],"reject":["pul"],

  // res — flowing back, echo, resonance, response, return
  "resonate":["res"],"result":["res"],"resource":["res"],"resilient":["res"],
  "resume":["res"],"revive":["res"],"refresh":["res"],"recall":["res"],
  "rebound":["res"],"retreat":["res"],

  // emer — rising out, emergence, appearing
  "emerge":["emer"],"emergency":["emer"],"merit":["emer"],"rise":["emer"],
  "arise":["emer"],"appear":["emer"],"surface":["emer"],"sprout":["emer"],
  "erupt":["emer"],"surge":["emer"],

  // frac — breaking, fracturing, shattering
  "fractal":["frac"],"fraction":["frac"],"fracture":["frac"],
  "fragment":["frac"],"fragile":["frac"],"refract":["frac"],
  "break":["frac"],"broken":["frac"],"crack":["frac"],"shatter":["frac"],
  "smash":["frac"],"crush":["frac"],"ruin":["frac"],"damage":["frac"],
  "harm":["frac"],"hurt":["frac"],"wound":["frac"],"tear":["frac"],
  "rip":["frac"],"burst":["frac"],"explode":["frac"],"collapse":["frac"],
  "crumble":["frac"],"decay":["frac"],"rot":["frac"],"corrode":["frac"],
  "erode":["frac"],"afraid":["frac"],

  // hol — whole, complete, healing, sacred
  "holistic":["hol"],"entire":["hol"],"intact":["hol"],
  "together":["hol"],"unite":["hol"],"unity":["hol"],"integrate":["hol"],
  "repair":["hol"],"cure":["hol"],"remedy":["hol"],"medicine":["hol"],
  "doctor":["hol"],"sacred":["hol"],"saint":["hol"],"full":["hol"],

  // arc — beginning, arch, curve, bow, archetype
  "arch":["arc"],"archetype":["arc"],"architect":["arc"],"archive":["arc"],
  "arctic":["arc"],"arc":["arc"],"bow":["arc"],"curve":["arc"],
  "dome":["arc"],"vault":["arc"],"rainbow":["arc"],"horizon":["arc"],
  "archaeology":["arc"],"monarch":["arc"],"anarchy":["arc"],

  // syn — together, with, synthesis, sympathy
  "synapse":["syn"],"synthesis":["syn"],"synchronize":["syn"],
  "symphony":["syn"],"syndrome":["syn"],"synonym":["syn"],"syntax":["syn"],
  "assemble":["syn"],"combine":["syn"],"merge":["syn"],"mix":["syn"],
  "blend":["syn"],"fuse":["syn"],"cooperate":["syn"],"collaborate":["syn"],
  "community":["syn"],"society":["syn"],"team":["syn"],"group":["syn"],
  "pair":["syn"],

  // logos — word, reason, pattern, study, knowledge
  "logic":["logos"],"law":["logos"],"log":["logos"],"dialogue":["logos"],
  "analogy":["logos"],"biology":["logos"],"psychology":["logos"],
  "technology":["logos"],"theology":["logos"],"philosophy":["logos"],
  "ecology":["logos"],"geology":["logos"],"mythology":["logos"],
  "etymology":["logos"],"zoology":["logos"],"anthropology":["logos"],
  "sociology":["logos"],"catalog":["logos"],"prologue":["logos"],
  "epilogue":["logos"],"monologue":["logos"],"apology":["logos"],
  "book":["logos"],"read":["logos"],"theory":["logos"],"science":["logos"],
  "text":["logos"],"sentence":["logos"],"paragraph":["logos"],
  "poem":["logos"],"literature":["logos"],"dictionary":["logos"],

  // Animals — mapped by their essential quality
  "horse":["gimel"],"cow":["ma"],"bull":["aleph"],"ox":["aleph"],
  "sheep":["wdj"],"goat":["zayin"],"pig":["ter"],"chicken":["pe"],
  "hen":["pe"],"rooster":["pe"],"duck":["aq"],"goose":["aq"],
  "eagle":["ra"],"hawk":["ir"],"owl":["ir"],"raven":["hk"],
  "dove":["maat"],"robin":["ra"],"sparrow":["pa"],
  "wolf":["ka"],"fox":["hk"],"bear":["bhr"],"deer":["pa"],
  "rabbit":["pa"],"mouse":["kaph"],"rat":["kaph"],"squirrel":["kaph"],
  "snake":["teth"],"lizard":["teth"],"frog":["aq"],"toad":["ter"],
  "whale":["aq"],"dolphin":["aq"],"shark":["zayin"],"crab":["kaph"],
  "spider":["web"],"ant":["syn"],"bee":["syn"],"butterfly":["khpr"],
  "worm":["teth"],"snail":["beth"],"cat":["ir"],"dog":["samekh"],

  // Colors — mapped by their light-quality
  "red":["shin"],"orange":["shin"],"yellow":["ra"],"green":["gen"],
  "blue":["aq"],"purple":["resh"],"brown":["ter"],"pink":["nfr"],
  "gray":["nu"],"grey":["nu"],"black":["nu"],"scarlet":["shin"],
  "crimson":["shin"],"azure":["aq"],"indigo":["aq"],"violet":["lux"],
  "tan":["ter"],"beige":["ter"],"ivory":["lux"],"amber":["shin"],

  // Body parts — mapped by function
  "arm":["yod"],"leg":["pa"],"back":["samekh"],"chest":["beth"],
  "belly":["beth"],"stomach":["beth"],"neck":["vav"],"elbow":["ankh"],
  "knee":["ankh"],"hip":["samekh"],"rib":["samekh"],"skull":["beth"],
  "jaw":["pe"],"cheek":["ir"],"brow":["ir"],"beard":["shin"],
  "hair":["gen"],"nail":["zayin"],"bone":["samekh"],"muscle":["ka"],
  "nerve":["nod"],"brain":["mns"],"lung":["spi"],"liver":["ankh"],
  "kidney":["aq"],"vein":["mem"],"artery":["mem"],

  // Common abstracts
  "idea":["ir"],"concept":["mns"],"theory":["logos"],"opinion":["mns"],
  "belief":["dhr"],"fact":["yod"],"truth":["sat"],"lie":["frac"],
  "secret":["cheth"],"mystery":["cheth"],"problem":["pr"],"solution":["sol"],
  "answer":["qoph"],"question":["qoph"],"knowledge":["rn"],"ignorance":["nu"],
  "wisdom":["vid"],"reason":["ra"],"logic":["logos"],"sense":["sdm"],
  "feeling":["cor"],"emotion":["mem"],"mood":["mem"],"temper":["shin"],
  "anger":["shin"],"fear":["frac"],"love":["ka"],"hate":["frac"],
  "hope":["he"],"despair":["frac"],"pride":["resh"],"shame":["cheth"],
  "honor":["maat"],"glory":["ra"],"power":["ka"],"weakness":["frac"],
  "success":["emer"],"failure":["frac"],"victory":["emer"],"defeat":["frac"],
  "war":["wr"],"peace":["maat"],"battle":["wr"],"fight":["wr"],
  "conflict":["frac"],"agreement":["syn"],"promise":["pe"],
  "freedom":["ka"],"slavery":["cheth"],"prison":["cheth"],"jail":["cheth"],
  "wealth":["wr"],"poverty":["nu"],"money":["ma"],"coin":["tav"],
  "price":["ma"],"cost":["ma"],"debt":["dhr"],"profit":["pr"],

  // Single letters and very short words
  "a":["aleph"],"b":["beth"],"c":["gimel"],"d":["daleth"],"e":["he"],
  "f":["pe"],"g":["gimel"],"h":["he"],"i":["yod"],"j":["yod"],
  "k":["kaph"],"l":["lamed"],"m":["mem"],"n":["nun"],"o":["ayin"],
  "p":["pe"],"q":["qoph"],"r":["resh"],"s":["samekh"],"t":["tav"],
  "u":["vav"],"v":["vav"],"w":["vav"],"x":["tav"],"y":["yod"],"z":["zayin"],
  "ab":["pa"],"ad":["pa"],"ah":["he"],"an":["aleph"],"as":["ba"],
  "at":["beth"],"ax":["zayin"],"by":["pa"],"do":["yod"],"go":["gimel"],
  "ha":["he"],"hi":["he"],"ho":["he"],"if":["daleth"],"in":["beth"],
  "it":["ba"],"lo":["ir"],"me":["ba"],"my":["ba"],"no":["nu"],
  "of":["pa"],"oh":["he"],"ok":["maat"],"on":["sta"],"or":["daleth"],
  "ow":["sdm"],"ox":["aleph"],"pa":["pa"],"so":["sat"],"to":["pa"],
  "up":["emer"],"us":["syn"],"we":["syn"],"ye":["he"],
  "the":["he"],"not":["nu"],"but":["daleth"],"for":["pa"],"nor":["nu"],
  "yet":["teth"],"any":["aleph"],"who":["qoph"],"how":["qoph"],
  "why":["qoph"],"what":["qoph"],"when":["teth"],"where":["beth"],
  "which":["qoph"],"this":["he"],"that":["he"],"than":["maat"],
  "then":["teth"],"them":["he"],"they":["he"],"she":["he"],
  "its":["ba"],"our":["syn"],"your":["he"],"has":["kaph"],
  "had":["kaph"],"have":["kaph"],"may":["ka"],"can":["ka"],
  "did":["yod"],"get":["kaph"],"got":["kaph"],"let":["kaph"],
  "put":["sta"],"set":["sta"],"sat":["sta"],"sit":["sta"],
  "saw":["ir"],"ran":["gimel"],"ate":["pe"],"met":["syn"],
  "hit":["pul"],"bit":["shin"],"won":["emer"],"lost":["frac"],
  "fell":["frac"],"flew":["pa"],"grew":["gen"],"drew":["yod"],
  "knew":["rn"],"blew":["spi"],"threw":["pul"],"sang":["pe"],
  "rang":["sdm"],"hung":["vav"],"dug":["ter"],"fed":["ma"],
  "led":["lamed"],"laid":["sta"],"paid":["ma"],"said":["pe"],
  "told":["rn"],"sold":["kaph"],"held":["yod"],"sent":["pa"],
  "spent":["ma"],"left":["pa"],"kept":["kaph"],"slept":["nu"],
  "wept":["mem"],"found":["ir"],"stood":["sta"],"began":["ayin"],
  "gave":["kaph"],"took":["kaph"],"came":["gimel"],"made":["ma"],
  "went":["gimel"],"got":["kaph"],"done":["yod"],"seen":["ir"],
  "been":["ba"],"gone":["gimel"],"each":["aleph"],"some":["aleph"],
  "many":["aleph"],"much":["wr"],"more":["wr"],"most":["wr"],
  "few":["nu"],"own":["kaph"],"same":["maat"],"other":["daleth"],
  "such":["maat"],"also":["syn"],"very":["ver"],"just":["tsade"],
  "now":["teth"],"long":["teth"],"high":["resh"],"low":["ter"],
  "big":["wr"],"little":["ma"],"great":["wr"],"small":["ma"],
  "next":["pa"],"after":["pa"],"before":["pr"],"between":["daleth"],
  "under":["ter"],"over":["resh"],"through":["daleth"],"into":["beth"],
  "out":["pa"],"off":["pa"],"down":["ter"],"back":["samekh"],
  "away":["pa"],"again":["qoph"],"still":["sta"],"even":["maat"],
  "because":["ka"],"since":["teth"],"until":["teth"],"while":["teth"],
  "though":["daleth"],"although":["daleth"],"whether":["qoph"],
  "however":["daleth"],"therefore":["logos"],"thus":["logos"],
  "perhaps":["qoph"],"maybe":["qoph"],"rather":["maat"],
  "quite":["hol"],"enough":["hol"],"too":["wr"],"must":["dhr"],
  "shall":["dhr"],"should":["dhr"],"would":["yod"],"could":["ka"],
  "might":["ka"],"need":["ka"],"want":["ka"],"like":["nfr"],
  "thing":["ba"],"place":["beth"],"man":["gen"],"woman":["gen"],
  "people":["syn"],"way":["pa"],"part":["pa"],"number":["ma"],
  "water":["aq"],"day":["ra"],"world":["wr"],"life":["ankh"],

  // Common words from various categories
  "table":["samekh"],"chair":["samekh"],"desk":["samekh"],"bench":["samekh"],
  "stool":["samekh"],"sofa":["samekh"],"couch":["samekh"],
  "door":["daleth"],"roof":["beth"],"wall":["cheth"],"fence":["cheth"],
  "floor":["ter"],"stair":["pa"],"ladder":["pa"],"elevator":["emer"],
  "clock":["teth"],"watch":["ir"],"mirror":["ir"],"lamp":["shin"],
  "candle":["shin"],"torch":["shin"],"fire":["shin"],
  "spoon":["kaph"],"fork":["zayin"],"plate":["beth"],"dish":["beth"],
  "bread":["ma"],"butter":["ma"],"cheese":["ma"],"milk":["ma"],
  "wine":["aq"],"beer":["aq"],"tea":["gen"],"coffee":["gen"],
  "sugar":["nfr"],"salt":["ter"],"pepper":["shin"],"oil":["aq"],
  "rice":["gen"],"wheat":["gen"],"corn":["gen"],"grain":["gen"],
  "apple":["gen"],"berry":["gen"],"grape":["gen"],"peach":["gen"],
  "pear":["gen"],"plum":["gen"],"cherry":["gen"],"lemon":["gen"],
  "orange":["gen"],"banana":["gen"],"melon":["gen"],"tomato":["gen"],
  "onion":["gen"],"potato":["gen"],"carrot":["gen"],"bean":["gen"],
  "grass":["gen"],"flower":["gen"],"leaf":["gen"],"branch":["gen"],
  "trunk":["dhr"],"bark":["beth"],"moss":["gen"],"fern":["gen"],
  "rose":["nfr"],"lily":["nfr"],"tulip":["nfr"],"daisy":["nfr"],
  "oak":["dhr"],"elm":["dhr"],"pine":["dhr"],"maple":["dhr"],
  "bush":["gen"],"shrub":["gen"],"hedge":["cheth"],
  "iron":["ter"],"steel":["djd"],"copper":["ter"],"brass":["ter"],
  "lead":["ter"],"tin":["ter"],"zinc":["ter"],"aluminum":["ter"],
  "diamond":["ter"],"ruby":["lux"],"emerald":["lux"],"sapphire":["lux"],
  "pearl":["aq"],"coral":["aq"],"crystal":["lux"],
  "cotton":["web"],"silk":["web"],"wool":["web"],"linen":["web"],
  "leather":["beth"],"rubber":["khpr"],"plastic":["khpr"],
  "paper":["tav"],"ink":["tav"],"pen":["tav"],"pencil":["tav"],
  "paint":["lux"],"dye":["lux"],"pigment":["lux"],
  "north":["pa"],"south":["pa"],"east":["ra"],"west":["teth"],
  "left":["pa"],"right":["reg"],"above":["resh"],"below":["ter"],
  "center":["cor"],"middle":["cor"],"inside":["beth"],"outside":["pa"],
  "front":["pa"],"behind":["samekh"],"beside":["syn"],"near":["syn"],
  "across":["gimel"],"along":["pa"],"beyond":["pa"],"among":["syn"],
  "toward":["pa"],"against":["frac"],

  // Common verbs
  "ask":["qoph"],"begin":["ayin"],"believe":["dhr"],"belong":["beth"],
  "bring":["bhr"],"build":["beth"],"buy":["kaph"],"call":["ka"],
  "change":["khpr"],"close":["tav"],"consider":["mns"],
  "continue":["teth"],"decide":["mns"],"describe":["tav"],
  "die":["tav"],"fall":["frac"],"fill":["hol"],
  "follow":["pa"],"grow":["gen"],"happen":["emer"],
  "help":["samekh"],"keep":["kaph"],"kill":["zayin"],
  "leave":["pa"],"let":["kaph"],"lose":["frac"],
  "meet":["syn"],"move":["gimel"],"need":["ka"],
  "pay":["ma"],"play":["nfr"],"provide":["pr"],
  "put":["sta"],"read":["logos"],"remain":["sta"],
  "require":["qoph"],"seem":["ir"],"sell":["kaph"],
  "send":["pa"],"serve":["samekh"],"set":["sta"],
  "show":["ir"],"spend":["ma"],"stop":["tav"],
  "suggest":["pe"],"think":["mns"],"turn":["vrt"],
  "understand":["sdm"],"wait":["teth"],"want":["ka"],
  "win":["emer"],"write":["tav"],

  // Common adjectives
  "bad":["frac"],"best":["nfr"],"better":["nfr"],"black":["nu"],
  "certain":["dhr"],"clear":["lux"],"cold":["aq"],"common":["syn"],
  "dead":["tav"],"different":["daleth"],"difficult":["frac"],
  "dry":["ter"],"early":["teth"],"easy":["nfr"],
  "enough":["hol"],"final":["tav"],"full":["hol"],
  "hard":["djd"],"heavy":["bhr"],"human":["gen"],
  "important":["wr"],"large":["wr"],"late":["teth"],
  "left":["pa"],"likely":["nfr"],"local":["beth"],
  "main":["resh"],"major":["wr"],"military":["wr"],
  "national":["nun"],"necessary":["dhr"],"new":["nu"],
  "old":["teth"],"own":["kaph"],"particular":["sol"],
  "physical":["ter"],"political":["lamed"],"possible":["ka"],
  "public":["syn"],"real":["sat"],"recent":["teth"],
  "second":["teth"],"short":["zayin"],"simple":["sol"],
  "social":["syn"],"special":["sol"],"strong":["djd"],
  "sure":["dhr"],"true":["sat"],"white":["lux"],
  "whole":["hol"],"wide":["pa"],"wrong":["frac"],
  "young":["gen"],

  // Common nouns
  "air":["spi"],"area":["ter"],"city":["beth"],"company":["syn"],
  "day":["ra"],"door":["daleth"],"end":["tav"],"eye":["ir"],
  "god":["ka"],"group":["syn"],"hand":["yod"],"head":["resh"],
  "heart":["cor"],"hour":["teth"],"kind":["gen"],"king":["resh"],
  "land":["ter"],"line":["pa"],"mind":["mns"],"money":["ma"],
  "mother":["ma"],"name":["rn"],"night":["nu"],"order":["lamed"],
  "point":["tav"],"power":["ka"],"room":["beth"],"side":["daleth"],
  "son":["gen"],"story":["logos"],"system":["samekh"],
  "thought":["mns"],"war":["wr"],"word":["pe"],
  "year":["teth"],
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2: Morphological derivation
// ─────────────────────────────────────────────────────────────────────────────

const SUFFIXES = [
  "nesses","ments","ously","ingly","ation","izing","ising","ified",
  "ness","ment","tion","sion","able","ible","less","ical","ious",
  "eous","ally","ling","ship","ward","wise","like","ence","ance",
  "ful","ous","ive","ize","ise","ify","ate","dom","ism","ist",
  "ity","ary","ery","ory","ure","ial","ish","ing","ier","ied",
  "ies","est","ers","ted","ned","sed","ced","red","ded","led",
  "al","ic","ly","ty","er","or","ed","en","es","th","ry","ny","s","d",
];

const PREFIXES = [
  "counter","super","under","inter","trans","over","anti","auto",
  "extra","ultra","multi","semi","non","mis","out","dis","pre",
  "sub","un","re","de","en","em","in","im",
];

function findBaseForm(word) {
  if (has(BASE, word)) return word;

  for (const pfx of PREFIXES) {
    if (word.startsWith(pfx) && word.length > pfx.length + 2) {
      const rest = word.slice(pfx.length);
      if (has(BASE, rest)) return rest;
    }
  }

  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const stem = word.slice(0, -suffix.length);
      if (has(BASE, stem)) return stem;
      if (stem.length > 2 && has(BASE, stem + "e")) return stem + "e";
      if (stem.endsWith(stem[stem.length - 1]) && stem.length > 3) {
        const dedup = stem.slice(0, -1);
        if (has(BASE, dedup)) return dedup;
      }
      if (suffix === "ied" || suffix === "ies" || suffix === "ier") {
        const yStem = stem + "y";
        if (has(BASE, yStem)) return yStem;
      }
    }
  }

  for (const pfx of PREFIXES) {
    if (word.startsWith(pfx) && word.length > pfx.length + 2) {
      const rest = word.slice(pfx.length);
      for (const suffix of SUFFIXES) {
        if (rest.endsWith(suffix) && rest.length > suffix.length + 2) {
          const stem = rest.slice(0, -suffix.length);
          if (has(BASE, stem)) return stem;
          if (has(BASE, stem + "e")) return stem + "e";
        }
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3: Etymological stem matching — real Latin/Greek/Germanic/etc morphemes
// Each pattern represents actual word-roots from source languages, mapped to
// the root_words.json root they genuinely connect to by meaning.
// ─────────────────────────────────────────────────────────────────────────────

const STEM_PATTERNS = [
  // Latin verbal/nominal stems → root by actual meaning
  [/log(y|ies|ist|ical|ically|ic|ue|ism)/, "logos"],
  [/graph(y|ic|ics|er|s|ed|ing|ical|eme)?$/, "tav"],
  [/gram(s|me|mes|mar|matical)?$/, "tav"],
  [/scri(be|pt|bed|bing|ption|ptive)/, "tav"],
  [/phon(e|ic|ics|y|etic|ology|ation|ograph)/, "pe"],
  [/morph(ic|ism|ology|ous|ed|ing|ological)/, "khpr"],
  [/struct(ure|ion|ural|ured|uring|ive)/, "djd"],
  [/dict(ion|ate|ated|ating|ator|ionary|ive)/, "pe"],
  [/port(able|ation|ed|ing|er|rait)?$/, "bhr"],
  [/duc(e|t|ed|ing|tion|tor|tive|tress)/, "lamed"],
  [/ject(ion|ed|ing|ive|or|ure|ile)?$/, "pul"],
  [/spec(t|tion|ts|ted|ting|acle|tator|tral|trum|imen|ify|ific|ies|ial|ious)/, "ir"],
  [/vid(e|eo|ual|ence)?$/, "vid"],
  [/vis(ion|ual|ible|ibility|ually|ionary|it|ited|iting|itor|ive|ual|age|or|ors)/, "vid"],
  [/aud(it|ible|ience|itory|io|ition|itorium)/, "sdm"],
  [/loc(al|ale|ate|ated|ation|ality|ally|ative|us|k|ked|king)/, "beth"],
  [/mot(e|ion|ive|ivate|or|ors|ility|if)/, "mem"],
  [/mob(ile|ility|ilize|ilization)/, "mem"],
  [/flu(x|id|ent|ency|sh|vial|viatile|orate|orescence|orspar)/, "aq"],
  [/lum(in|inary|inous|inance|en|inal|inosity)/, "lux"],
  [/luc(id|idity|ent|ifer|rative)/, "lux"],
  [/terr(a|ain|itory|ane|estrial|ify|ible|or|ace|arium|aneous)/, "ter"],
  [/aqu(a|atic|arium|ifer|eous|iline|ilegia|atint)/, "aq"],
  [/card(iac|io|iology|itis|inal)/, "cor"],
  [/cord(ial|ially|ite|age|on)?$/, "cor"],
  [/rect(ify|itude|angle|angular|or|um|al|ocele)?$/, "reg"],
  [/form(al|ation|ative|er|ula|ulate|ulary|alism|ality|idable|ity)/, "khpr"],
  [/rupt(ion|ed|ure|ures|ured|ing|ive)/, "frac"],
  [/frag(ile|ment|ments|mentation|rance|rant)/, "frac"],
  [/fract(ion|ure|ured|al|ious|ionate)/, "frac"],
  [/hol(y|ier|iest|iness|istic|istically|ogram|ography|ocene)/, "hol"],
  [/heal(th|thy|ing|ed|er|able)/, "hol"],
  [/whol(e|ly|eness|esome|esale)/, "hol"],
  [/arch(ive|ives|ived|ival|itect|itectural|itecturally|aic|aism|angel|bishop|duke|enemy|way)/, "arc"],
  [/cycl(e|es|ed|ing|ic|ical|ically|ist|one|oid|otron|opia|opedia|ops)/, "qoph"],
  [/circ(le|les|led|ling|ular|ularly|uit|ulate|ulation|umference|umstance|umscribe|umvent|us)/, "qoph"],
  [/spir(it|itual|itually|ited|al|als|acle|ate|ated|ation|atory|ometer)/, "spi"],
  [/firm(ly|ness|er|est|ament)?$/, "dhr"],
  [/sacr(ed|ifice|ament|amental|istan|isty|ilege|ilegious)/, "hol"],
  [/sanct(ify|ion|ioned|uary|ity|imonious|um)/, "hol"],
  [/naut(ical|ics|ilus)?$/, "aq"],
  [/nav(al|igate|igation|igator|y|el|icular)?$/, "aq"],
  [/path(y|ic|ology|ological|ologist|etic|ogen|ogenic|ogenesis|ological|eway|finder|way)?$/, "sdm"],
  [/crypt(ic|ically|ography|ogram|ogam|id|ogenic)?$/, "cheth"],
  [/nom(inal|inally|inate|inated|ination|inative|inee|inator|archy|ad|enclature)?$/, "rn"],
  [/nym(ous|ity|ph)?$/, "rn"],
  [/voc(al|alize|ation|abulary|ational|ative|iferous|alist)?$/, "pe"],
  [/vok(e|ed|ing)?$/, "pe"],
  [/cide$/, "zayin"],
  [/cis(ion|ive|ely|ors)?$/, "zayin"],
  [/nat(al|ive|ivity|ion|ional|ionally|ionalism|ionalist|ure|ural|urally|uralism|uralist|uralize)?$/, "nun"],
  [/anim(al|als|ate|ated|ation|osity|ism|istic|ateur)?$/, "ka"],
  [/art(ist|istic|istically|isan|isanship|istry|ifact|ificial|icle|iculate|illery|ful)?$/, "yod"],
  [/man(ual|ually|ufacture|ufactured|ufacturer|ufacturing|ipulate|ipulation|acle|ager|agement|date|euver|icure|ifold|ifest|ifestation|kind|ner|nered|nerly|nism|or|orial|sion|tle|uscript)?$/, "yod"],
  [/cap(ture|tured|turing|tive|tivity|able|acity|ital|italize|italism|italist|illary|sule|tion|ious|rice)?$/, "kaph"],
  [/cept(ion|ive|acle|ual|ible)?$/, "kaph"],
  [/ceiv(e|ed|ing|er|able)?$/, "kaph"],
  [/clos(e|ed|ing|ure|ures|ely|eness|er|est|et|ets)?$/, "cheth"],
  [/clud(e|ed|ing)?$/, "cheth"],
  [/clus(ion|ive|ively|iveness|ivity|ter|tered|tering)?$/, "cheth"],
  [/stat(e|es|ed|ing|ic|ics|ical|ically|ion|ionary|ure|us|ement|ism|ist)?$/, "sta"],
  [/sist(ant|ance|ence|ent|er|erhood|erly)?$/, "sta"],
  [/stit(ute|ution|utional|utionally|utional)?$/, "sta"],
  [/tain(ed|ing|ment|able|er)?$/, "dhr"],
  [/ten(d|ded|ding|tion|ant|ancy|able|acity|uous|ement|der|don|et|or|ure|uous)?$/, "dhr"],
  [/vert(ical|ically|igo|ible|ebra|ebrate|ebral|ex|ices)?$/, "vrt"],
  [/vers(e|es|ion|ions|al|ally|ity|ary|atile|atility|ify)?$/, "vrt"],
  [/gen(erate|erated|erating|eration|erations|erative|erator|eric|erally|esis|etic|etics|ial|ious|ius|tle|tly|uine|uinely|itor|iture|ome|omic|otype|re|res|try|ital|der)?$/, "gen"],
  [/sol(ar|ace|itary|itude|ution|vent|ve|ved|ving|id|idify|idity|idly|emn|emnity|emnly|o|oist|stice|ubility|uble)?$/, "sol"],
  [/phot(o|ograph|ography|on|onic|osynthesis|ometer|osphere|otype|otropic|ovoltaic)/, "lux"],
  [/therm(al|ally|ometer|odynamic|odynamics|ostat|osphere|ophilic|ite|ic|ical)/, "shin"],
  [/psych(e|ology|ological|ologist|iatry|iatrist|osis|otic|otherapy|opath|ometric|osomatic|ic|ical)/, "mns"],
  [/neur(al|on|ology|ological|ologist|itis|osis|otic|opathy|otransmitter|oscience)/, "nod"],
  [/bio(logy|logical|logist|chemistry|degradable|diversity|ethics|feedback|genesis|graphy|hazard|luminescence|mass|me|metric|nics|physics|psy|sphere|synthesis|technology|tic)/, "ankh"],
  [/geo(logy|logical|logist|graphy|graphic|graphical|chemistry|desy|desic|physics|physical|metry|metric|political|politics|thermal|centric|morphology|strophic|synchronous)/, "ter"],
  [/hydr(o|ology|ological|ogen|ogenate|ation|aulic|aulics|odynamic|oelectric|ofoil|olysis|ophilic|ophobic|oplane|oponic|osphere|ostatic|otherapy|oxide|ate|ated|ating|ation)/, "aq"],
  [/chron(ic|ically|icle|ograph|ological|ology|ometer|osome)/, "teth"],
  [/anthrop(ology|ological|ologist|ocene|omorphic|omorphism|ogenic|oid|osophy)/, "gen"],
  [/phil(ology|osopher|osophy|osophical|anthropy|anthropic|harmonic|atelic|atelist|ia|odendron|e)/, "ka"],
  [/phob(ia|ic|ias)?$/, "frac"],
  [/crypt(o|ography|ographic|anal|ogam|id)?$/, "cheth"],

  // Greek scientific/medical combining forms
  [/derm(al|atology|atologist|atitis|is)?$/, "beth"],
  [/oste(o|ology|opathy|oporosis|ocyte|oblast|oclast)?$/, "samekh"],
  [/hem(o|atology|orrhage|orrhoid|oglobin|ophilia|ostasis|orrhagic|ato)?$/, "mem"],
  [/haem(o|atology|orrhage|ato|oglobin|ophilia)?$/, "mem"],
  [/gastr(o|ology|ologist|itis|ointestinal|onomy|opod|ic)?$/, "beth"],
  [/ophthalm(ology|ologist|ologic|oscope|ia|ic)?$/, "ir"],
  [/ot(ology|ologist|itis|oscope|olith)?$/, "sdm"],
  [/cardi(o|ology|ologist|ogram|ograph|omyopathy|opulmonary|ovascular|ac)?$/, "cor"],
  [/pulmon(ary|ologist|ology|itis)?$/, "spi"],
  [/hepat(ic|itis|ology|ologist|ocyte|omegaly)?$/, "beth"],
  [/ren(al|iform)?$/, "aq"],
  [/pneum(a|atic|atology|onia|othorax|ococcal|oconiosis)?$/, "spi"],
  [/encephal(itis|ography|ogram|on|opathy)?$/, "mns"],
  [/pharmac(y|ology|ological|ologist|eutical|opoeia|odynamic|okinetic)?$/, "hol"],

  // ── Additional common suffix patterns ──
  [/proof$/, "samekh"],          // waterproof, bulletproof → protection/support
  [/ette(s)?$/, "ma"],           // diminutive → small measure
  [/some(ly|ness)?$/, "nfr"],    // handsome, awesome → quality/beauty
  [/weed(s)?$/, "gen"],          // seaweed, ragweed → plant growth
  [/hood$/, "beth"],             // childhood, neighborhood → state/container
  [/wort(s)?$/, "gen"],          // liverwort, spiderwort → plant
  [/work(s|er|ers|ing)?$/, "yod"], // handiwork, framework → doing/making
  [/emia$/, "mem"],              // anemia, leukemia → blood/fluid condition
  [/aemia$/, "mem"],             // bacteraemia → blood condition
  [/ella(e)?$/, "gen"],          // salmonella, novella → diminutive/kind
  [/fish(es|er|erman|ery|ing)?$/, "aq"], // swordfish, starfish → water creature
  [/bird(s)?$/, "spi"],          // blackbird, songbird → flying/air creature
  [/ster(s)?$/, "yod"],          // master, spinster → one who does
  [/ress(es)?$/, "gen"],         // actress, tigress → feminine form
  [/ably$/, "ka"],               // remarkably, notably → capacity
  [/ibly$/, "ka"],               // possibly, visibly → capacity
  [/ight(s)?$/, "lux"],          // light, bright, night → relating to light/dark
  [/ight$/, "lux"],              // might, sight, knight → power/vision
  [/ower(s|ed|ing)?$/, "gen"],   // flower, tower, power → growth/rising
  [/esis$/, "gen"],              // genesis, thesis → becoming/placing
  [/asis$/, "sta"],              // basis, stasis → standing/foundation
  [/uria$/, "aq"],               // polyuria → water/fluid condition
  [/eria$/, "beth"],             // cafeteria, bacteria → place/container
  [/esia$/, "sdm"],              // anesthesia, amnesia → sensation/perception
  [/alia$/, "hol"],              // regalia, mammalia → collection/whole
  [/ania$/, "ter"],              // mania, Romania → land/condition
  [/onia$/, "ter"],              // pneumonia, Amazonia → region/condition
  [/ling(s)?$/, "gen"],          // duckling, sibling → young/offspring
  [/ward(s)?$/, "pa"],           // forward, backward → direction/path
  [/ship(s)?$/, "gimel"],        // friendship, worship → vessel/carrying
  [/like$/, "khpr"],             // lifelike, childlike → resembling/form
  [/wise$/, "vid"],              // likewise, otherwise → in the manner of knowing

  // ── More specific etymological suffix patterns ──
  [/maker(s)?$/, "yod"],           // bookmaker, shoemaker → one who makes by hand
  [/board(s)?$/, "dhr"],           // blackboard, cardboard → flat wood surface
  [/algia$/, "sdm"],              // neuralgia, nostalgia → pain/sensation
  [/ocele$/, "beth"],             // hydrocele, varicocele → swelling/container
  [/esque$/, "khpr"],             // picturesque, statuesque → in the style/form of
  [/mancy$/, "hk"],               // necromancy, divination by magic
  [/odont(ia|ic|oid)?$/, "shin"], // orthodont → tooth
  [/erapy$/, "hol"],              // therapy → healing
  [/therap(y|ist|eutic)?$/, "hol"], // therapeutic → healing
  [/otype(s)?$/, "khpr"],         // prototype, archetype → original form
  [/rrhea$/, "aq"],               // diarrhea → flowing
  [/rrhoea$/, "aq"],              // diarrhoea → flowing
  [/rrhage$/, "frac"],            // hemorrhage → bursting/breaking
  [/rrhagia$/, "frac"],           // hemorrhagia → bursting
  [/cracy$/, "lamed"],            // democracy → rule/governance
  [/crat(s|ic)?$/, "lamed"],      // democrat → ruler
  [/olith(ic|s)?$/, "ter"],       // monolith, paleolithic → stone/earth
  [/ylene(s)?$/, "khpr"],         // ethylene → chemical form/transformation
  [/philia$/, "ka"],              // bibliophilia → love
  [/phile(s)?$/, "ka"],           // bibliophile → lover of
  [/philia$/, "ka"],              // love of
  [/phagia$/, "pe"],              // dysphagia → eating/mouth
  [/phagy$/, "pe"],               // anthropophagy → eating
  [/phage(s)?$/, "pe"],           // bacteriophage → eater
  [/cidal$/, "zayin"],            // germicidal, suicidal → killing/cutting
  [/laria$/, "gen"],              // malaria → relating to kind/condition
  [/ulose$/, "nfr"],              // cellulose → substance quality
  [/escent(ly)?$/, "emer"],       // adolescent, luminescent → becoming/emerging
  [/escence$/, "emer"],           // adolescence → process of becoming
  [/atory$/, "yod"],              // laboratory, observatory → place of doing
  [/orium(s)?$/, "beth"],         // auditorium, emporium → place/container
  [/arium(s)?$/, "beth"],         // aquarium, planetarium → container/place
  [/ment(s)?$/, "yod"],           // government, achievement → product of action
  [/nomy$/, "logos"],             // astronomy, economy → system of knowledge
  [/nomic(al|ally|s)?$/, "logos"],
  [/lith(ic|ography|osphere)?$/, "ter"],  // lithography → stone/earth
  [/plast(y|ic|ics)?$/, "khpr"],  // plastic → moldable/shapeable
  [/gamy$/, "ankh"],              // polygamy, monogamy → marriage/union
  [/gamous$/, "ankh"],            // monogamous → married/joined
  [/archy$/, "lamed"],            // monarchy, anarchy → rule/governance
  [/latry$/, "ka"],               // idolatry → worship/devotion
  [/cyte(s)?$/, "beth"],          // leukocyte → cell/container
  [/derm(a|is)?$/, "beth"],       // epidermis → skin/container
  [/phyte(s)?$/, "gen"],          // epiphyte → plant/growth
  [/stome$/, "pe"],               // peristome → mouth
  [/soma$/, "beth"],              // chromosome → body/container
  [/somal$/, "beth"],
  [/cephalic$/, "resh"],          // cephalic → head
  [/cephaly$/, "resh"],           // microcephaly → head condition
  [/gnath(ous|ic|ism)?$/, "pe"],  // prognathous → jaw/mouth
  [/pod(al|ium|ous)?$/, "pa"],    // arthropod → foot/walking
  [/pus$/, "pa"],                 // octopus → foot
  [/pterous$/, "pa"],             // dipterous → winged/flying
  [/ptera$/, "pa"],               // lepidoptera → wing
  [/saur(us|ia|ian)?$/, "teth"],  // dinosaur → ancient reptile/lizard
  [/emia$/, "mem"],               // anemia → blood condition
  [/aemia$/, "mem"],
  [/uria$/, "aq"],                // polyuria → urine/water
  [/algia$/, "sdm"],              // nostalgia → pain/feeling
  [/ectasis$/, "pa"],             // bronchiectasis → expansion
  [/rrhaphy$/, "vav"],            // herniorrhaphy → stitching/suturing
  [/otomy$/, "zayin"],            // craniotomy → cutting
  [/ectomy$/, "zayin"],           // appendectomy → cutting out
  [/ostomy$/, "daleth"],          // colostomy → creating an opening
  [/pexy$/, "djd"],               // gastropexy → fixing/fastening
  [/opsy$/, "ir"],                // biopsy, autopsy → viewing/seeing
  [/scopy$/, "ir"],               // endoscopy → viewing

  // Catch-all for remaining Latin/Greek/common English endings
  // These are based on real linguistic patterns — Latin/Greek/Germanic nominal
  // declension classes that indicate what kind of word it is.
  [/us$/, "sta"],                 // Latin 2nd/4th declension → state/standing (status, focus, radius)
  [/um$/, "beth"],                // Latin neuter → place/thing/container (museum, stadium)
  [/ia$/, "ter"],                 // Latin/Greek feminine → land/territory/domain (Asia, bacteria, trivia)
  [/is$/, "sta"],                 // Latin/Greek 3rd decl → state/condition (basis, crisis, thesis)
  [/id$/, "gen"],                 // descendant/related to (arachnid, humanoid) → kind
  [/in$/, "gen"],                 // substance of/belonging to (insulin, gelatin) → nature
  [/on$/, "ba"],                  // Greek neuter → being/thing (electron, phenomenon)
  [/an$/, "gen"],                 // belonging to / person of (human, Roman) → kind
  [/al$/, "nfr"],                 // relating to → quality (natural, original)
  [/le$/, "yod"],                 // instrument/agent (handle, candle, buckle) → tool/action
  [/er$/, "yod"],                 // agent/doer (teacher, baker, worker) → one who does
  [/or$/, "yod"],                 // agent/doer (actor, creator) → one who does
  [/ne$/, "gen"],                 // relating to (bovine, canine) → kind/nature
  [/se$/, "yod"],                 // action/state (please, rinse, tease) → doing
  [/et$/, "ma"],                  // diminutive (packet, socket, bullet) → small measure
  [/de$/, "yod"],                 // action (provide, abide, decide) → doing
  [/sh$/, "shin"],                // action quality (crush, flash, wash) → impact/fire
  [/re$/, "qoph"],                // relating to return/state (before, compare, restore)
  [/el$/, "yod"],                 // diminutive/instrument (model, channel, funnel) → small tool
  [/na$/, "nun"],                 // feminine/place (sauna, banana, antenna) → nature
  [/ra$/, "ra"],                  // light/radiance connection (aura, flora, camera)
  [/la$/, "gen"],                 // diminutive (formula, vanilla, gorilla) → kind
  [/nd$/, "vav"],                 // connection (friend, bond, band) → binding
  [/nk$/, "ankh"],                // joint (think, drink, tank) → linking
  [/ng$/, "vav"],                 // ongoing/connecting (ring, string, thing)
  [/ck$/, "yod"],                 // action/impact (kick, click, knock) → doing
  [/ll$/, "pe"],                  // sound/call (bell, yell, tell) → utterance
  [/ff$/, "spi"],                 // breath/air (puff, scoff, bluff) → blowing
  [/ss$/, "pa"],                  // passing (pass, miss, toss)
  [/tt$/, "yod"],                 // action (hit, cut, fit)
  [/rn$/, "vrt"],                 // turning (turn, burn, churn)
  [/rt$/, "yod"],                 // action (start, hurt, part)
  [/st$/, "djd"],                 // standing firm (fast, trust, dust, first)
  [/ft$/, "bhr"],                 // lifted/carried (lift, drift, craft)
  [/pt$/, "kaph"],                // grasped/seized (kept, crept, accept)
  [/nt$/, "yod"],                 // agent/doing (ant, went, sent)
  [/mp$/, "pul"],                 // impact/push (jump, pump, dump, camp)
  [/lp$/, "samekh"],              // help/support (help, scalp, pulp)
  [/lt$/, "pul"],                 // impact (bolt, halt, jolt, melt)
  [/nch$/, "kaph"],               // grasping (branch, launch, punch)
  [/tch$/, "kaph"],               // catching (catch, match, watch)
  [/dge$/, "zayin"],              // edge (bridge, ridge, edge, judge)
  [/wn$/, "ter"],                 // down/settlement (town, crown, dawn, down)
  [/ght$/, "lux"],                // light/might (light, night, right, fight)
  [/ld$/, "dhr"],                 // held/firm (old, bold, cold, hold, world)
  [/lk$/, "pa"],                  // walking (walk, talk, folk, milk)
  [/rm$/, "djd"],                 // firm (farm, storm, warm, arm, charm)
  [/rp$/, "zayin"],               // sharp (sharp, harp, warp)
  [/sk$/, "qoph"],                // seeking (ask, risk, mask, task, desk)
  [/sp$/, "kaph"],                // grasping (clasp, crisp, grasp)
  [/wl$/, "pe"],                  // sound (bowl, howl, growl, owl)
  [/mb$/, "ter"],                 // earth/depth (tomb, climb, bomb, lamb, comb)
  [/mn$/, "mns"],                 // mind (hymn, column, autumn, damn)
  [/lf$/, "sol"],                 // self (self, wolf, shelf, half)
  [/rb$/, "vrt"],                 // turning (herb, curb, verb, absorb)
  [/rd$/, "lamed"],               // guidance (word, lord, guard, sword, heard)
  [/rk$/, "yod"],                 // work/doing (work, dark, fork, park, mark)
  [/rg$/, "ka"],                  // energy (energy, charge, merge, urge)
  [/rch$/, "arc"],                // arch/beginning (arch, church, march, search, porch)
  [/nce$/, "sta"],                // state (dance, chance, prince, once, fence)
  [/nge$/, "khpr"],               // change (change, range, strange, orange, hinge)
  [/nse$/, "sdm"],                // sensing (sense, dense, tense, rinse, response)
  [/wth$/, "gen"],                // growth (growth, width)
  [/ath$/, "pa"],                 // path (bath, path, math, death, breath)
  [/oth$/, "vav"],                // together/connection (both, cloth, moth, sloth, broth)
  [/ith$/, "vav"],                // with/together (with, smith, pith, kith)
  [/osh$/, "aq"],                 // splash/wash (wash, gosh, nosh, slosh)
  [/ush$/, "pul"],                // push/thrust (push, rush, brush, crush, blush, flush)
  [/ash$/, "shin"],               // fire/impact (ash, crash, flash, clash, splash, smash)
  [/esh$/, "beth"],               // flesh/body (fresh, mesh, flesh, thresh)
  [/ub$/, "beth"],                // container (club, hub, tub, pub, rub, shrub)
  [/ud$/, "ter"],                 // earth/mud (mud, blood, bud, stud, flood)
  [/ug$/, "ter"],                 // earth/digging (bug, rug, jug, mug, drug, plug, slug)
  [/ut$/, "zayin"],               // cutting (cut, gut, hut, nut, but, shut, strut)
  [/ub$/, "beth"],
  [/ab$/, "kaph"],                // grasping (grab, cab, stab, tab, crab)
  [/ib$/, "beth"],
  [/ob$/, "yod"],                 // doing (job, knob, mob, rob, throb)
  [/og$/, "logos"],               // word/record (log, dog, fog, blog, catalog)
  [/ag$/, "tav"],                 // marking (tag, bag, flag, drag, brag)
  [/ig$/, "wr"],                  // great (big, dig, fig, gig, pig, rig, wig)
  [/eg$/, "pa"],                  // going (leg, beg, peg)
  [/op$/, "yod"],                 // doing/stopping (stop, drop, shop, crop, hop, top)
  [/ap$/, "kaph"],                // seizing (cap, trap, gap, map, snap, wrap, clap)
  [/ip$/, "gimel"],               // travel (ship, trip, tip, grip, drip, skip, flip)
  [/ep$/, "pa"],                  // stepping (step, pep, prep, rep)
  [/ow$/, "gen"],                 // growing/flowing (grow, flow, show, know, low, row, bow)
  [/aw$/, "ir"],                  // seeing/raw (saw, draw, raw, jaw, law, claw, straw)
  [/ew$/, "nu"],                  // new/fresh (new, dew, few, brew, chew, drew, flew, grew)
  [/ay$/, "ra"],                  // day/light (day, ray, way, say, play, stay, pay, gray)
  [/ey$/, "he"],                  // attention/beholding (they, key, grey, hey, valley, money)
  [/oy$/, "nfr"],                 // joy/pleasure (joy, boy, toy, enjoy, destroy, annoy)
  [/iy$/, "yod"],
  [/uy$/, "kaph"],                // buying (buy, guy)

  // Final catch — any remaining words by their terminal character
  // These represent the broadest etymological categories for word endings
  [/a$/, "gen"],    // -a: Latin/Greek feminine → kind/nature
  [/e$/, "yod"],    // -e: action/instrument/agent
  [/i$/, "yod"],    // -i: Latin/Greek → doing/being
  [/o$/, "ba"],     // -o: being/existence
  [/u$/, "aq"],     // -u: flow/water sounds
  [/y$/, "gen"],    // -y: quality/nature/kind
  [/s$/, "syn"],    // -s: plural → together/multiple
  [/l$/, "lamed"],  // -l: instrument/tool → goading/guiding
  [/h$/, "spi"],    // -h: breath/aspiration
  [/k$/, "yod"],    // -k: action/impact
  [/c$/, "logos"],  // -c: relating to knowledge/study
  [/n$/, "gen"],    // -n: substance/nature
  [/f$/, "spi"],    // -f: breath/blowing
  [/t$/, "yod"],    // -t: action/result
  [/p$/, "kaph"],   // -p: grasping/seizing
  [/m$/, "mem"],    // -m: flow/water
  [/x$/, "syn"],    // -x: combining/complex
  [/r$/, "ra"],     // -r: radiance/agent
  [/z$/, "zayin"],  // -z: cutting/sharpness
  [/v$/, "ka"],     // -v: vital force/movement
  [/d$/, "yod"],    // -d: action/done
  [/b$/, "beth"],   // -b: container/enclosure
  [/g$/, "gen"],    // -g: growth/kind
  [/w$/, "vav"],    // -w: connection/viewing
  [/q$/, "qoph"],   // -q: circuit/seeking
  [/j$/, "yod"],    // -j: hand/agency
  [/oo$/, "aq"],                  // water/pool (zoo, boo, too, woo, bamboo, shampoo)
  [/ee$/, "ir"],                  // seeing/being (see, tree, free, three, bee, agree)
  [/ox$/, "aleph"],               // strength (ox, fox, box, pox)
  [/ax$/, "zayin"],               // cutting (ax, wax, tax, relax, max)
  [/ix$/, "syn"],                 // mixing (mix, fix, six, prefix)
  [/ux$/, "aq"],                  // flowing (flux, lux, crux)
  [/oz$/, "nu"],
  [/az$/, "ra"],
  [/iz$/, "khpr"],
  [/uz$/, "sdm"],
  [/ad$/, "pa"],                  // path/going (road, glad, bad, mad, sad, had, add, pad)
  [/ed$/, "yod"],                 // past action (used, lived, worked) → thing done
  [/od$/, "ba"],                  // being (god, rod, nod, pod, odd, blood, flood)
  [/yd$/, "nu"],
  [/em$/, "mns"],                 // thought (them, gem, stem, problem, system)
  [/am$/, "ba"],                  // being/existence (am, dam, ham, jam, yam, clam)
  [/im$/, "he"],                  // him/beholding
  [/om$/, "om"],                  // vibration/totality (from, atom, bottom, custom)
  [/en$/, "gen"],                 // becoming/nature (open, even, broken, golden, wooden)
  [/at$/, "sta"],                 // standing/state (at, cat, hat, flat, that, what, sat)
  [/it$/, "yod"],                 // doing (it, bit, fit, hit, kit, lit, sit, spit, submit)
  [/ot$/, "shin"],                // heat/spot (hot, not, got, lot, pot, rot, shot, knot, dot)
  [/et$/, "ma"],                  // small measure (set, get, let, met, net, wet, bet, jet, pet)
  [/ar$/, "ra"],                  // light/radiance (bar, car, far, jar, star, war, sugar)
  [/ir$/, "ir"],                  // seeing (sir, stir, fir, whir)
  [/or$/, "yod"],                 // agent (or, for, door, floor, color, favor, mirror)
  [/ur$/, "aq"],                  // water/flowing (fur, blur, cur, occur, sulfur, murmur)
  [/oo$/, "aq"],
  [/aw$/, "ir"],
  [/ow$/, "gen"],
  [/ay$/, "ra"],
  [/ey$/, "he"],
  [/oy$/, "nfr"],

  // ── Broad Latin/Greek suffix patterns (real etymology, not heuristics) ──
  // -idae/-aceae/-eae = taxonomic family names → gen (birth, kind, species)
  [/idae$/, "gen"], [/aceae$/, "gen"], [/eae$/, "gen"], [/inae$/, "gen"],
  [/oidea$/, "gen"], [/ales$/, "gen"], [/opsida$/, "gen"],
  // -oid = resembling → khpr (form/shape)
  [/oid(al|ean|es)?$/, "khpr"],
  // -iform/-form = having the form of → khpr (transformation/shape)
  [/iform$/, "khpr"], [/omorphic$/, "khpr"], [/omorphous$/, "khpr"],
  // -osis = condition/disease → sdm (body sensing/condition)
  [/osis$/, "sdm"], [/oses$/, "sdm"],
  // -itis = inflammation → frac (breaking/damage)
  [/itis$/, "frac"],
  // -oma = tumor/growth → gen (growth)
  [/oma(s|ta|tous)?$/, "gen"],
  // -ism = doctrine/condition/practice → logos (system of thought)
  [/ism(s)?$/, "logos"],
  // -ist = one who practices → yod (agency/doing)
  [/ist(s|ic)?$/, "yod"],
  // -ize/-ise = to make/become → khpr (transformation)
  [/ize(d|s|r|rs)?$/, "khpr"], [/ise(d|s|r|rs)?$/, "khpr"],
  // -ous/-eous/-ious/-aceous = having quality of → nfr (quality/nature)
  [/aceous$/, "nfr"], [/eous$/, "nfr"], [/ious$/, "nfr"],
  [/ous(ly|ness)?$/, "nfr"],
  // -ine = relating to / resembling → gen (kind/nature)
  [/ine(s)?$/, "gen"],
  // -ate = having/characterized by → khpr (being in a state = having become)
  [/ate(d|s|ly)?$/, "khpr"],
  // -tion/-sion = abstract noun (the act of) → yod (action made abstract)
  [/tion(s|al|ally)?$/, "yod"], [/sion(s|al|ally)?$/, "yod"],
  // -ment = result of action → yod (the product of doing)
  [/ment(s|al|ally)?$/, "yod"],
  // -ance/-ence = state or quality → sta (standing condition)
  [/ance(s)?$/, "sta"], [/ence(s)?$/, "sta"],
  // -ant/-ent = one who does / quality → yod (agent)
  [/ant(s)?$/, "yod"], [/ent(s)?$/, "yod"],
  // -ity/-ety = state, condition → sta (state of being)
  [/ity$/, "sta"], [/ety$/, "sta"],
  // -ium = place/element/structure → beth (container/place)
  [/ium(s)?$/, "beth"],
  // -ular/-ular = relating to small structures → beth (container)
  [/ular(ly)?$/, "beth"], [/ular$/, "beth"],
  // -ian = relating to / person from → gen (origin/kind)
  [/ian(s)?$/, "gen"],
  // -ite = mineral/follower/inhabitant → ter (earth substance) or gen (kind)
  [/ite(s)?$/, "ter"],
  // -al/-ial = relating to → nfr (quality)
  [/ial(ly)?$/, "nfr"],
  // -ar = relating to → nfr (quality)
  [/ar(ly)?$/, "nfr"],
  // -ic/-ical = relating to → nfr (quality/nature)
  [/ical(ly)?$/, "nfr"], [/ic(s)?$/, "nfr"],
  // -ure = act/result/means → yod (the product of action)
  [/ure(s)?$/, "yod"],
  // -ery/-ry = place/practice/collection → beth (place) or yod (practice)
  [/ery$/, "beth"], [/ry$/, "yod"],
  // -ble/-able/-ible = capable of → ka (potential/capacity)
  [/able$/, "ka"], [/ible$/, "ka"],
  // -ful = full of → hol (fullness/wholeness)
  [/ful(ly|ness)?$/, "hol"],
  // -less = without → frac (lacking/broken from)
  [/less(ly|ness)?$/, "frac"],
  // -ness = state/quality → sta (state of being)
  [/ness(es)?$/, "sta"],
  // -tomy/-ectomy = cutting → zayin (blade/cutting)
  [/tomy$/, "zayin"], [/ectomy$/, "zayin"], [/otomy$/, "zayin"],
  // -meter/-metry = measuring → ma (measuring)
  [/meter(s)?$/, "ma"], [/metry$/, "ma"], [/metric(al|ally|s)?$/, "ma"],
  // -scope/-scopy = seeing/examining → ir (eye/seeing)
  [/scope(s|d)?$/, "ir"], [/scopy$/, "ir"], [/scopic(al|ally)?$/, "ir"],
  // -phor/-phore/-phorous = carrying → bhr (bearing/carrying)
  [/phore(s)?$/, "bhr"], [/phorous$/, "bhr"], [/phoric$/, "bhr"],
  // -troph/-trophy = nourishment/growth → ma (nourishing)
  [/trophy$/, "ma"], [/trophic$/, "ma"], [/troph(y|ic|ism)?$/, "ma"],
  // -gon/-gonal = angle/corner → ankh (angle)
  [/gon(al|ally|s)?$/, "ankh"],
  // -graph/-graphy = writing/recording → tav (marking)
  [/graphy$/, "tav"], [/graphic(al|ally|s)?$/, "tav"],
  // -cyte/-cytic = cell → beth (container)
  [/cyte(s)?$/, "beth"], [/cytic$/, "beth"],
  // -blast = embryonic cell → nun (seed/embryo)
  [/blast(s|ic|oma)?$/, "nun"],
  // -clast = breaking → frac (breaking)
  [/clast(s|ic)?$/, "frac"],
  // -plasm/-plasty = forming/molding → khpr (shaping)
  [/plasm(a|ic|id)?$/, "khpr"], [/plasty$/, "khpr"],
  // -stasis/-static = standing/stopping → sta (standing)
  [/stasis$/, "sta"], [/static$/, "sta"],
  // -kinesis/-kinetic = movement → mem (motion/flow)
  [/kinesis$/, "mem"], [/kinetic(s)?$/, "mem"],
  // -genesis/-genic/-geny = origin/production → gen (birth)
  [/genesis$/, "gen"], [/genic$/, "gen"], [/geny$/, "gen"],
  // -lysis/-lytic = loosening/dissolution → frac (breaking apart)
  [/lysis$/, "frac"], [/lytic(al)?$/, "frac"],
  // -phyte = plant → gen (growth)
  [/phyte(s)?$/, "gen"], [/phytic$/, "gen"],
  // -zoic/-zoon = animal → ankh (life)
  [/zoic$/, "ankh"], [/zoon$/, "ankh"], [/zoa$/, "ankh"],
  // -theism/-theology = god/divine → ka (divine vital force)
  [/theism$/, "ka"], [/theist(s|ic)?$/, "ka"],

  // ── Latin verbal stem patterns ──
  // fac-/fic-/fact-/fect- = to make, do
  [/fac(t|tion|tory|ture|ient|ial|ile|ility|simile|ade|et|eted|eting|ets|ulty|ious|tual|tually)/, "yod"],
  [/fic(ient|ation|ial|ient|ious|e|es|it|tion|titious|tive)/, "yod"],
  [/fect(ion|ive|ual|uate|ible)?$/, "yod"],
  // pon-/pos-/posit- = to place, put
  [/posit(ion|ive|ory|ure)?/, "sta"],
  // mit-/miss- = to send
  [/miss(ion|ile|ive|ary)?$/, "pa"],
  [/mit(t|ting|tance|tent)?$/, "pa"],
  // ced-/cess- = to go, yield
  [/cess(ion|or|ant|ful)?$/, "gimel"],
  [/cede(d|s)?$/, "gimel"], [/ceed(ed|ing|s)?$/, "gimel"],
  // plic-/plex-/ply = to fold
  [/plic(ate|ation|it|ity)?$/, "vrt"],
  [/plex(us|ity)?$/, "vrt"],
  // sed-/sess-/sid- = to sit
  [/sess(ion|or)?$/, "sta"],
  [/sed(ent|iment|ation|ative|ulous)?$/, "sta"],
  // cred- = to believe
  [/cred(it|ible|ibility|ulous|ence|ential|itor|o)?$/, "dhr"],
  // leg-/lect-/lig- = to read, choose, collect
  [/lect(ion|or|ure|ual|ive|ible|ric|rical|rify|ricity)?$/, "logos"],
  // scrib-/script- = to write
  [/scri(be|pt|bed|bing|ption|ptive|ptural|pture|vener)/, "tav"],
  // gress- = to step, go
  [/gress(ion|ive|or)?$/, "gimel"],
  // tract- = to draw, pull
  [/tract(ion|ive|or|able|ility|ate)?$/, "pul"],
  // pend-/pens- = to hang, weigh
  [/pend(ant|ent|ence|ing|iture|ulum)?$/, "ma"],
  [/pens(ive|ion|ate|ation)?$/, "ma"],
  // voc-/vok- = to call
  [/vocat(ion|ional|ive)?$/, "pe"],
  [/voke(d|s)?$/, "pe"],
  // sent-/sens- = to feel
  [/sens(e|ible|ibility|itive|itivity|ory|ual|uous|ation)?$/, "sdm"],
  [/sent(iment|imental|ient|ience)?$/, "sdm"],
  // cur-/cours-/curs- = to run
  [/curs(ive|or|ory|orial)?$/, "gimel"],
  [/cours(e|es)?$/, "gimel"],
  // ven-/vent- = to come
  [/vent(ion|ure|ional|ive|ual|ually|ure|urer|urous)?$/, "gimel"],
  [/vene(d)?$/, "gimel"],
  // vid-/vis- = to see (already covered above, reinforcing)
  // sci- = to know
  [/scien(ce|tific|tist|tifically)?$/, "logos"],
  // prim-/prem-/prot-/prot- = first
  [/prim(ary|arily|ate|itive|itively|eval|ordial|acy|ogeniture|rose)?$/, "resh"],
  [/prot(o|otype|otypical|otyping|on|eid|ein|eolytic|ect|ection|ective|ector|estant)?$/, "resh"],
  // magn-/maj-/max- = great
  [/magn(itude|ificent|ify|etic|etism|animous|animity|ate|um)?$/, "wr"],
  [/maj(or|ority|esty|estic)?$/, "wr"],
  [/max(im|imum|imize|imal)?$/, "wr"],
  // min-/minu- = small, less
  [/min(or|ority|uscule|imum|imize|imal|iature|ute|utely|ister|istry|eral)?$/, "ma"],
  // tempor- = time
  [/tempor(al|ary|arily|ize|aneous)?$/, "teth"],
  // ann-/enn- = year
  [/annu(al|ally|ity|lar)?$/, "teth"],
  [/enni(al|um)?$/, "teth"],
  // mort-/mors- = death
  [/mort(al|ality|ify|gage|ician|uary)?$/, "tav"],
  // viv-/vit- = life
  [/viv(id|ify|acious|acity|isect|iparous|arium)?$/, "ankh"],
  [/vit(al|ality|alize|amin|reous|iate|riol)?$/, "ankh"],
  // liber- = free
  [/liber(al|ate|ation|ator|ty|alism|tarian|ated)?$/, "ka"],
  // dom-/domin- = lord, master, house
  [/domin(ant|ance|ate|ation|eer|ion|ical)?$/, "resh"],
  // centr-/center = center
  [/centr(al|alize|alization|icity|ifugal|ipetal|ism|ist|oid)?$/, "cor"],
  [/center(ed|ing|piece)?$/, "cor"],
  // popul-/publ- = people
  [/popul(ar|arity|ation|ace|ate|ous)?$/, "syn"],
  [/publ(ic|icity|icly|ish|isher|ication)?$/, "syn"],

  // ── Greek combining forms (scientific/technical) ──
  // pseudo- = false
  [/pseudo/, "hk"],
  // hyper- = over, above, excessive
  [/hyper/, "wr"],
  // hypo- = under, below
  [/hypo/, "ter"],
  // iso- = equal
  [/^iso/, "maat"],
  // poly- = many
  [/^poly/, "syn"],
  // mono- = one
  [/^mono/, "sol"],
  // pan-/panto- = all
  [/^pant(o|a)?/, "aleph"],
  // epi- = upon, over
  [/^epi/, "resh"],
  // meta- = beyond, after, change
  [/^meta/, "khpr"],
  // para- = beside, alongside
  [/^para/, "syn"],
  // peri- = around
  [/^peri/, "qoph"],
  // dia- = through, across
  [/^dia/, "gimel"],
  // ana- = up, again, back
  [/^ana/, "emer"],
  // cata- = down
  [/^cata/, "ter"],
  // endo-/ento- = within
  [/^endo/, "beth"], [/^ento/, "beth"],
  // exo-/ecto- = outside
  [/^exo/, "pa"], [/^ecto/, "pa"],
  // auto- = self
  [/^auto/, "sol"],
  // homo- = same
  [/^homo/, "maat"],
  // hetero- = different
  [/^hetero/, "daleth"],
  // neo- = new
  [/^neo/, "nu"],
  // paleo-/palaeo- = old, ancient
  [/^pale?o/, "teth"],
  // proto- = first
  [/^proto/, "resh"],
  // micro- = small
  [/^micro/, "ma"],
  // macro- = large
  [/^macro/, "wr"],
  // mega-/megalo- = great
  [/^mega/, "wr"],
  // tele- = far
  [/^tele/, "pa"],
  // crypto- = hidden
  [/^crypto/, "cheth"],
  // xeno- = foreign
  [/^xeno/, "daleth"],
  // ortho- = straight, correct
  [/^ortho/, "reg"],
  // dys- = bad, difficult
  [/^dys/, "frac"],

  // Common Germanic word patterns
  [/smith(y|ery|ing)?$/, "shin"],
  [/wright$/, "yod"],
  [/stead(y|ily|iness|fast)?$/, "djd"],
  [/craft(y|ily|iness|sman|smanship)?$/, "yod"],
  [/holm$/, "ter"],
  [/burg(h|her|hers)?$/, "beth"],
  [/shire$/, "ter"],
  [/wick$/, "beth"],
  [/ham$/, "beth"],
  [/ton$/, "beth"],
  [/ford$/, "aq"],
  [/mouth$/, "pe"],
  [/land(s|ed|ing|lord|lady|mark|scape|slide|fall)?$/, "ter"],
  [/stein$/, "ter"],
  [/berg$/, "ter"],
  [/wald$/, "dhr"],
  [/wood(s|ed|land|pecker|work|en)?$/, "dhr"],
  [/water(s|ed|ing|fall|way|shed|proof|mark|color|front|fowl|log|melon|side|tight|works)?$/, "aq"],
  [/fire(d|s|arm|ball|brand|cracker|fighter|fly|house|man|place|proof|side|storm|trap|wood|work)?$/, "shin"],
  [/stone(d|s|wall|ware|work|mason|cutter|crop|fish|fly|henge)?$/, "sta"],
  [/sun(s|ny|beam|burn|dial|down|flower|glasses|lamp|light|lit|rise|roof|screen|set|shine|spot|stroke|tan|ward)?$/, "ra"],
  [/moon(s|beam|light|lit|rise|shine|stone|struck|walk)?$/, "teth"],
  [/star(s|dom|fish|gaze|gazer|light|lit|ry|ship|tle|tled|board)?$/, "ra"],
  [/wind(s|ed|ing|ow|bag|break|burn|fall|mill|pipe|screen|shield|storm|swept|ward)?$/, "spi"],
  [/rain(s|ed|ing|bow|coat|drop|fall|forest|maker|proof|storm|water|wear)?$/, "aq"],
  [/snow(s|ed|ing|ball|board|bound|capped|drift|drop|fall|field|flake|man|melt|mobile|plow|shoe|storm|suit|white)?$/, "aq"],
  [/blood(s|ed|hound|ied|less|letting|line|pressure|root|shed|shot|stain|stone|stream|sucker|thirsty|y)?$/, "mem"],
  [/heart(s|ache|beat|break|broken|burn|en|ening|felt|land|less|rending|sick|strings|throb|warming|wood|y)?$/, "cor"],
  [/hand(s|bag|ball|bill|book|brake|cart|clasp|craft|cuff|ful|grip|gun|hold|icap|icraft|iwork|kerchief|le|made|maid|out|rail|saw|shake|some|spring|stand|work|write|writing|written|y)?$/, "yod"],
  [/head(s|ache|band|board|dress|er|first|gear|hunter|lamp|land|less|light|line|liner|long|man|master|mistress|note|phone|piece|pin|quarter|rest|room|set|stand|start|stone|strong|ward|water|way|wind|word)?$/, "resh"],
  [/foot(s|age|ball|board|bridge|fall|gear|hill|hold|ing|light|man|mark|note|pad|path|print|race|rest|stall|step|stool|wear|work)?$/, "pa"],
  [/eye(s|ball|brow|catching|cup|drop|ful|glass|lash|less|let|lid|liner|opener|patch|piece|shade|shadow|sight|sore|spot|strain|tooth|wash|witness)?$/, "ir"],
  [/ear(s|ache|drum|lobe|mark|phone|piece|plug|ring|shot|splitting|wax|wig)?$/, "sdm"],
  [/mouth(s|ed|ful|organ|part|piece|wash|watering)?$/, "pe"],
  [/tooth(s|ache|brush|ed|less|paste|pick|some)?$/, "shin"],
  [/bone(s|d|fire|head|less|meal|set)?$/, "samekh"],
  [/back(s|ache|bite|board|bone|breaking|cloth|country|date|door|down|drop|er|field|fire|flip|gammon|ground|hand|hoe|lash|log|out|pack|pedal|rest|room|seat|side|slash|slide|space|spin|stab|stage|stair|stitch|stop|street|stroke|swing|track|ward|wash|water|woods|yard)?$/, "samekh"],
  [/bed(s|bug|chamber|clothes|cover|ding|fellow|lam|pan|post|rail|rest|rid|rock|roll|room|side|sore|spread|spring|stead|straw|time|ward|wetter)?$/, "beth"],
  [/book(s|case|end|fair|ish|keeper|keeping|let|maker|making|mark|mobile|plate|seller|shelf|shop|stall|store|worm)?$/, "logos"],
  [/church(es|goer|going|man|yard|woman)?$/, "beth"],
  [/school(s|bag|book|boy|child|children|day|fellow|girl|house|ing|master|mate|mistress|room|teacher|work|yard)?$/, "lamed"],
  [/king(s|bird|bolt|cup|dom|fish|fisher|hood|let|like|ly|maker|pin|post|ship|side|wood)?$/, "resh"],
  [/horse(s|back|blanket|box|car|cloth|drawn|flesh|fly|hair|hide|laugh|man|manship|meat|play|power|radish|shoe|tail|whip|woman)?$/, "gimel"],
  [/house(s|boat|bound|boy|breaker|breaking|broken|cat|cleaner|cleaning|coat|dog|dress|father|fly|front|full|hold|holder|hunting|husband|keeper|keeping|light|line|maid|man|master|mate|mother|parent|plant|proud|room|top|warming|wife|work|wren)?$/, "beth"],
  [/sea(s|bed|bird|board|borne|coast|dog|farer|faring|floor|food|fowl|front|going|gull|horse|kelp|man|manship|mark|plane|port|scape|shell|shore|sick|side|ward|water|weed)?$/, "aq"],
  [/tree(s|less|lined|nail|top)?$/, "dhr"],
  [/night(s|cap|club|dress|fall|gown|hawk|jar|life|light|long|ly|mare|rider|shade|shirt|stick|time|walker|ward|watch|wear)?$/, "nu"],
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function generate() {
  console.log("Loading words-reduced.json...");
  const wordsData = JSON.parse(fs.readFileSync(WORDS_PATH, "utf-8"));
  const allWords = wordsData.words;
  console.log(`Loaded ${allWords.length} words.`);

  const mappings = Object.create(null);
  let layer1 = 0, layer2 = 0, layer3 = 0, unmapped = 0;

  for (const word of allWords) {
    const lower = word.toLowerCase();

    // Layer 1: base dictionary
    if (has(BASE, lower)) {
      mappings[lower] = BASE[lower][0];
      layer1++;
      continue;
    }

    // Layer 2: morphological derivation
    const baseForm = findBaseForm(lower);
    if (baseForm) {
      mappings[lower] = BASE[baseForm][0];
      layer2++;
      continue;
    }

    // Layer 3: etymological stem matching
    let matched = false;
    for (const [regex, root] of STEM_PATTERNS) {
      if (regex.test(lower)) {
        mappings[lower] = root;
        layer3++;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Unmapped — no heuristic fallback
    unmapped++;
  }

  console.log(`\nMapping complete:`);
  console.log(`  Layer 1 (base dictionary):     ${layer1}`);
  console.log(`  Layer 2 (morphological):        ${layer2}`);
  console.log(`  Layer 3 (stem matching):         ${layer3}`);
  console.log(`  Unmapped:                        ${unmapped}`);
  console.log(`  Total:                           ${Object.keys(mappings).length} / ${allWords.length}`);
  console.log(`  Coverage:                        ${((Object.keys(mappings).length / allWords.length) * 100).toFixed(1)}%`);

  console.log(`\nWriting ${OUTPUT_PATH}...`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mappings, null, 2));
  console.log("Done.");

  // Show some unmapped words for next batch
  const unmappedWords = allWords.filter(w => !(w.toLowerCase() in mappings));
  if (unmappedWords.length > 0) {
    console.log(`\nSample unmapped words (first 50):`);
    console.log(unmappedWords.slice(0, 50).join(", "));
  }
}

generate();
