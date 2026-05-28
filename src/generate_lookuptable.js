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
