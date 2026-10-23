// W3 / W11a - the guided-path CONTENT: for every step of every Tier 1 deck, the QUESTION a dealt card carries as its placeholder (q), the one plain "?" sentence (e) and one example (x).
// Source: Fable's copy of the Wrizors' w3-deck-content.md (md5 347e3efc057eece588c27dc28d1d5c3a), parsed by a script - never retyped, so a stray character cannot drift from the doc. 112 steps.
//
// WHY A SIBLING FILE, NOT deskLexicon.ts's CANONICAL (the brief's "questionTerm / explainTerm / exampleTerm - the existing deskTerm discipline"): this is DECK CONTENT, not chrome. The doc's own
// rule 3: "the other themes' lexicons translate only the chrome, not the questions (the questions are deck content)" - so there is no per-theme override, and ~375 sentences stay out of
// the lexicon census (flux-v2's LX2 reads every CANONICAL key through Flux's forbidden-noun list; story-craft prose says "page one"). The discipline kept: every word lives in exactly ONE
// place (this file), reached only through stepQuestion / stepExplain / stepExample below - no deck file, component or harness hard-codes a sentence. Where a question varies by the deal's own
// answer (Worldbuilding's Rules, Grant's Alignment, Feature Story's Nut Graf, Fifteen Beats' step 8) `q` is a record keyed by the answer's option id; the "?" sentence and example are shared.
// Examples are content for the "?" and never appear on a card; they never travel with a Tutor ask unless the writer opened that entry (doc, rule 5).
export interface StepContent { q: string | Record<string, string>; e: string; x: string }

export const DECK_CONTENT: Record<string, Record<string, StepContent>> = {
  "three-act": {
    "hook": {
      "q": "What is the first thing that makes this world feel off?",
      "e": "The hook is the first image or line that makes a reader need the next one.",
      "x": "The book opens by insisting a dead man is dead, then shows Scrooge refusing to warm his own office."
    },
    "inciting": {
      "q": "What happens that the ordinary world can't absorb?",
      "e": "The inciting incident is the event that knocks the ordinary life off balance and starts the story.",
      "x": "Marley's ghost drags his chains into Scrooge's bedroom and promises three more visitors."
    },
    "threshold": {
      "q": "What does your protagonist do that they can't take back?",
      "e": "The first threshold is the choice or push that commits the protagonist to the journey.",
      "x": "Scrooge takes the first spirit's hand and is carried out through the wall into his own past."
    },
    "complications": {
      "q": "What keeps getting harder, and why can't they walk away?",
      "e": "Rising complications are the pressures that grow in the middle so the protagonist can't simply quit.",
      "x": "The past shows him the boy left alone at school and the woman who released him from their engagement."
    },
    "midpoint": {
      "q": "What do they learn here that changes what they're after?",
      "e": "The midpoint reversal flips what the protagonist believed, so the second half pursues a different goal.",
      "x": "The present spirit shows him the Cratchits' thin table and throws his own \"surplus population\" back at him."
    },
    "darkest": {
      "q": "What does defeat look like for them, exactly?",
      "e": "The darkest point is the lowest moment, where losing becomes real and specific.",
      "x": "The last spirit shows a neglected grave with his own name cut into it."
    },
    "climax": {
      "q": "What is actually being decided in the final confrontation?",
      "e": "The climax is the last confrontation, where the story's real question is settled.",
      "x": "Scrooge grips the spirit's robe and swears he will honour Christmas and live in the past, present and future."
    },
    "resolution": {
      "q": "What settles, and what is different now?",
      "e": "The resolution shows the world after the climax and what the change costs or gives.",
      "x": "He wakes on Christmas morning, sends the prize turkey to the Cratchits and raises Bob's salary."
    },
    "final-image": {
      "q": "How does the last image answer the first one?",
      "e": "The final image mirrors the hook so the reader can measure the change.",
      "x": "The man who refused to warm his office becomes a second father to Tiny Tim."
    }
  },
  "feature-screenplay": {
    "opening-image": {
      "q": "What does your protagonist's life look like before anything changes?",
      "e": "The opening image is the before-picture the ending will be measured against.",
      "x": "Dorothy on a gray Kansas prairie where even the grass and the house have been bleached by the sun."
    },
    "theme-stated": {
      "q": "What does someone say, almost in passing, that this story is really about?",
      "e": "The theme stated is the story's question, spoken early by someone who doesn't know it's the theme.",
      "x": "Dorothy tells the Scarecrow that people would rather live in a dreary home than in any beautiful country."
    },
    "set-up": {
      "q": "What is missing from this life, and who else lives in it?",
      "e": "The set-up shows the world, the people and the flaw or lack the story will test.",
      "x": "The farm, Uncle Henry and Aunt Em who never laugh, and Toto, the one thing that makes Dorothy laugh."
    },
    "catalyst": {
      "q": "What happens that there's no going back from?",
      "e": "The catalyst is the event that knocks the protagonist out of the before-picture for good.",
      "x": "The cyclone lifts the farmhouse and sets it down in Oz, on top of a wicked witch."
    },
    "debate": {
      "q": "What makes your protagonist hesitate before committing?",
      "e": "The debate is the last pause, where the protagonist weighs whether to go at all.",
      "x": "Dorothy asks the Munchkins and the Witch of the North how to get home, and learns the only hope is a wizard far away."
    },
    "break-into-two": {
      "q": "What choice takes them into a world that works by different rules?",
      "e": "Break into two is the step out of the old world and into the story's upside-down version of it.",
      "x": "She puts on the silver shoes, locks the farmhouse door and sets off on the road of yellow brick."
    },
    "b-story": {
      "q": "Which relationship carries what this story is about?",
      "e": "The B story is the second thread, usually a relationship, that carries the theme while the plot runs.",
      "x": "The Scarecrow, the Tin Woodman and the Lion, each missing the thing he most prizes."
    },
    "fun-and-games": {
      "q": {
        "screen": "What are the scenes the reader came for (the trailer moments)?",
        "novel": "What are the scenes the reader came for?"
      },
      "e": "Fun and games delivers the promise of the premise: the scenes the idea exists for.",
      "x": "Kalidahs, a river crossing, a field of deadly poppies and a stork that rescues the Scarecrow."
    },
    "midpoint": {
      "q": "What false victory or false defeat raises the stakes and starts the clock?",
      "e": "The midpoint is a win or loss that turns out to be the opposite, and the stakes go up.",
      "x": "They reach the Emerald City, and the Wizard tells them they'll get nothing until the Wicked Witch of the West is dead."
    },
    "bad-guys": {
      "q": "What tightens from outside, and what tightens from inside?",
      "e": "Bad guys close in is the stretch where outer pressure and inner doubt grow together.",
      "x": "The Witch sends wolves, crows, bees and Winkies, then the Winged Monkeys."
    },
    "all-is-lost": {
      "q": "What dies here, literally or in spirit?",
      "e": "All is lost is the lowest point, often marked by a death or something like one.",
      "x": "The Monkeys scatter the Scarecrow's straw, dent the Tin Woodman and carry Dorothy off to be the Witch's slave."
    },
    "dark-night": {
      "q": "What does your protagonist realise, alone, before finding the way through?",
      "e": "The dark night of the soul is the hopeless pause before the protagonist finds what they didn't know they had.",
      "x": "Dorothy, a captive, weeps for home and doesn't know the shoes she has worn all along could carry her there."
    },
    "break-into-three": {
      "q": "What idea arrives from the two stories combining?",
      "e": "Break into three is the solution that comes when the plot and the relationship thread meet.",
      "x": "In a flash of anger over a stolen shoe, Dorothy throws a bucket of water and the Witch melts."
    },
    "finale": {
      "q": "How does your protagonist prove they've changed by winning their own way?",
      "e": "The finale is the final test, passed in a way the old self couldn't have managed.",
      "x": "The Wizard is unmasked as a humbug, his balloon leaves without her, and she walks on to Glinda."
    },
    "final-image": {
      "q": "What does the after-picture show that the opening couldn't?",
      "e": "The final image answers the opening image with visible proof of the change.",
      "x": "Dorothy clicks the silver heels together and is rolling in the Kansas grass, running to Aunt Em."
    }
  },
  "character-study": {
    "want-need": {
      "q": "What do they think they want, and what do they actually need?",
      "e": "Want vs. need is the gap between the goal a character chases and the change they require.",
      "x": "Elizabeth wants to be right about people; she needs to doubt her first readings of them."
    },
    "wound": {
      "q": "What old injury still runs their decisions?",
      "e": "The wound is the past hurt that explains present behaviour without excusing it.",
      "x": "Darcy was raised to be proud of his name and taught to distrust anyone who wants it."
    },
    "contradiction": {
      "q": "What about them doesn't add up, on purpose?",
      "e": "The contradiction is the trait that cuts against the rest and makes a character feel alive.",
      "x": "Darcy, who disdains the Bennets, pays Wickham's debts in secret to save their youngest daughter."
    },
    "voice": {
      "q": "How do they talk that no one else in the story does?",
      "e": "Voice notes catch the rhythm, vocabulary and habits that make a character's speech their own.",
      "x": "Mr Bennet answers everything with a dry joke; Mr Collins never says a thing in fewer than forty words."
    },
    "relationship": {
      "q": "What do these two want from each other, and what is unresolved between them?",
      "e": "The relationship card holds the pull and the open question between two characters.",
      "x": "Elizabeth and Darcy each want the other to see them clearly; neither will say so first."
    }
  },
  "worldbuilding": {
    "rules": {
      "q": {
        "fantasy": "What can magic do here, and what does it cost?",
        "sf": "What can the technology do, and what does it cost?",
        "other": "What are this world's own rules, and what do they cost?"
      },
      "e": "The rules are what is possible in this world and the price of using it; limits make a world believable.",
      "x": "Everything in Lilliput is one-twelfth the size of home, so a man is a mountain and a cow fits in a pocket."
    },
    "history": {
      "q": "What happened long before page one that still shapes everything?",
      "e": "Deep history is the past the characters inherit, whether or not they know it.",
      "x": "A war over which end of an egg to crack has split two nations for generations."
    },
    "places": {
      "q": "Where does this story happen, and what does the land demand of the people in it?",
      "e": "Places and maps are the geography that forces choices: distance, borders, weather, routes.",
      "x": "An island kingdom a channel away from its enemy, so every quarrel becomes a naval one."
    },
    "cultures": {
      "q": "Who are the groups, and what does each one want?",
      "e": "Cultures and factions are the peoples and parties whose wants collide to make plot.",
      "x": "Two court parties told apart by the height of their heels, each certain the other is ruining the country."
    },
    "power": {
      "q": "Who has power, who wants it, and what does it run on?",
      "e": "Power and economy answers who decides and what the world is paid in.",
      "x": "An emperor who rules by spectacle and a treasury that strains to feed one giant guest."
    },
    "language": {
      "q": "Which words, names and turns of phrase belong only to this world?",
      "e": "Language notes are the sounds of the world: names, invented words, the way people swear and greet.",
      "x": "Gulliver is titled the Man-Mountain in the local tongue, and learns the language in three weeks."
    },
    "iceberg": {
      "q": "What do you know that the reader never sees, but that makes the rest true?",
      "e": "The iceberg is the knowledge under the surface that keeps the visible world consistent.",
      "x": "Why the court fears the giant more than it admits, which the narrator never says outright."
    }
  },
  "thesis": {
    "question": {
      "q": "What single question does this whole work exist to answer?",
      "e": "The research question is the one question every chapter serves.",
      "x": "Did the arrival of the public timetable change how novels of the 1850s measured a day?"
    },
    "methodology": {
      "q": "How will you answer the question, and why does this method fit it?",
      "e": "Methodology is the chosen way of answering, justified against the alternatives.",
      "x": "Close reading of time-words in six novels before and after 1848, counted and compared."
    },
    "lit-review": {
      "q": "Which conversations is the existing work already having, and where do you join?",
      "e": "Lit-review clusters group the sources by the argument they share, not by the alphabet.",
      "x": "One cluster on railway history, one on narrative time, one on the serial novel's deadlines."
    },
    "evidence": {
      "q": "What have you found that doesn't have a home in the argument yet?",
      "e": "The evidence parking lot holds findings, quotations and data until the argument has a place for them.",
      "x": "A letter where a novelist complains that the 9:40 train has ruined his mornings."
    },
    "citation": {
      "q": "Which sources will you need to cite, and have you tracked each one?",
      "e": "The citation ledger is the running list of everything that must appear in the bibliography.",
      "x": "Every edition, archive and article used, with the page that will be cited."
    },
    "chapter-one": {
      "q": "What must this chapter establish before the next can build on it?",
      "e": "A first chapter lays the ground: terms, context and the claim in its first form.",
      "x": "The timetable as an object: who printed it, who read it, what it promised."
    },
    "chapter-two": {
      "q": "Where does the argument deepen or complicate itself?",
      "e": "A second chapter tests the claim against the harder cases.",
      "x": "Two novels that ignore clock time entirely, and why they still prove the point."
    },
    "chapter-three": {
      "q": "Where does the argument turn toward its own implications?",
      "e": "A third chapter asks what follows if the claim is true.",
      "x": "What a punctual plot does to suspense, and to the reader's patience."
    },
    "conclusion": {
      "q": "What have you actually shown, and what does it change?",
      "e": "The conclusion states the claim as proven, no larger and no smaller.",
      "x": "The hour replaced the day as the novel's unit, and the serial deadline helped."
    },
    "introduction": {
      "q": "What gap in the existing work does this study fill?",
      "e": "The introduction names the gap and the question that fills it.",
      "x": "No study has counted time-words across the 1848 divide."
    },
    "methods": {
      "q": "What exactly did you do, in enough detail to be repeated?",
      "e": "Methods is the recipe another researcher could follow.",
      "x": "Six novels, three time-word categories, two coders, one disagreement rule."
    },
    "results": {
      "q": "What did you find, reported straight, before any interpretation?",
      "e": "Results is the findings alone, with no argument attached yet.",
      "x": "Clock-time words triple after 1848; day-words fall by a third."
    },
    "discussion": {
      "q": "What do the results mean, and what don't they mean?",
      "e": "Discussion is where the findings meet the question and their limits are named.",
      "x": "The shift is real, but six novels can't say whether the railway or the serial caused it."
    }
  },
  "grant": {
    "need": {
      "q": "What is the problem, stated plainly, and what shows it's real?",
      "e": "The need statement names the problem and proves it exists with evidence, not adjectives.",
      "x": "Forty per cent of the town's third-graders read below grade level, by the district's own test."
    },
    "objectives": {
      "q": "What will be different, specifically, if this is funded?",
      "e": "Objectives are the measurable changes the money buys.",
      "x": "Sixty children read with a tutor twice a week for a school year; half reach grade level."
    },
    "methods": {
      "q": "How does the work get done, step by step?",
      "e": "Methods is the plan in order: who does what, where, and when.",
      "x": "Recruit twelve tutors in September, train them in October, match them by November."
    },
    "evaluation": {
      "q": "How will you know it worked, and how will you show it?",
      "e": "The evaluation plan says what will be measured and how it will be reported.",
      "x": "The same district test in May, compared with the fall score, reported to the funder in June."
    },
    "budget": {
      "q": "What does each line pay for, in the work itself?",
      "e": "Budget justification ties every cost to a specific piece of the plan.",
      "x": "Tutor stipends for twelve people for thirty weeks; books for sixty children; one coordinator's hours."
    },
    "alignment": {
      "q": {
        "foundation": "Where does their mission, in their own words, meet this work?",
        "government": "Where do the programme's stated priorities meet this work?",
        "corporate": "Where do their stated giving priorities meet this work?"
      },
      "e": "Funder alignment shows the funder their own goals inside your plan.",
      "x": "Their annual report names early literacy first; this programme is early literacy, in their county."
    }
  },
  "feature-story": {
    "nut-graf": {
      "q": {
        "profile": "In one paragraph: who is this person, and why does this story matter now?",
        "trend": "What's the trend, and why does it matter now?",
        "investigative": "What did you find, and why does it matter now?"
      },
      "e": "The nut graf is the paragraph that tells the reader what the story is and why today.",
      "x": "A keeper retires next month, and no one is being trained to replace her."
    },
    "lede-a": {
      "q": "Which moment could you drop the reader into first?",
      "e": "A scene-first lede opens inside a moment the reader can see.",
      "x": "The keeper climbing ninety-one steps in the dark with a thermos."
    },
    "lede-b": {
      "q": "Which line of someone's speech could open the story?",
      "e": "A voice-first lede lets a quotation or a spoken line lead.",
      "x": "Her first words to a visitor about what the fog does to sound."
    },
    "lede-c": {
      "q": "Which single fact earns the whole story?",
      "e": "A fact-first lede opens with the one detail that makes the story matter.",
      "x": "The lamp has not gone dark for a night in ninety years."
    },
    "source-1": {
      "q": "Who said what, and why are they the right person to say it?",
      "e": "A source card holds a voice and the reason the reader should trust it.",
      "x": "The harbourmaster on what ships still steer by the light."
    },
    "source-2": {
      "q": "Which second voice complicates the first?",
      "e": "A second source keeps the story honest by disagreeing or adding.",
      "x": "A coastguard officer who says the satellites make the lamp a sentiment."
    },
    "scene-1": {
      "q": "Which moment can you show rather than summarise?",
      "e": "A scene card is a moment with a place, people and something happening.",
      "x": "The keeper polishing the lens while the fog signal counts the minutes."
    },
    "scene-2": {
      "q": "Which later moment shows what has changed since the first?",
      "e": "A second scene lets the story move through time.",
      "x": "The empty cottage on the hill, boxes half packed."
    },
    "kicker-a": {
      "q": "Which closing line echoes the lede?",
      "e": "A kicker that echoes the lede closes the loop the opening drew.",
      "x": "The ninety-one steps, climbed by no one."
    },
    "kicker-b": {
      "q": "Which closing line opens out to the wider point?",
      "e": "A kicker that opens out leaves the reader with the larger question.",
      "x": "What else we keep lit because someone always has."
    }
  },
  "hero-journey": {
    "ordinary-world": {
      "q": "What does home look like, and what is quietly wrong with it?",
      "e": "The ordinary world is the life the hero will leave, shown so the reader can miss it.",
      "x": "Jim Hawkins at the Admiral Benbow inn, serving a drunken old sea-captain who pays no bill."
    },
    "call": {
      "q": "What arrives that asks the hero to leave?",
      "e": "The call is the invitation or demand that the story cannot proceed without.",
      "x": "The captain dies and Jim finds the oilskin packet with a map of an island and a cross."
    },
    "refusal": {
      "q": "Why does the hero hesitate, and what does the hesitation cost?",
      "e": "The refusal is the fear or duty that makes the hero pause, which proves the stakes.",
      "x": "Jim and his mother hide under the bridge while blind Pew's gang ransacks the inn."
    },
    "mentor": {
      "q": "Who gives the hero what they lack, and what is the gift?",
      "e": "The mentor supplies knowledge, a tool or courage; the hero still has to use it.",
      "x": "Dr Livesey and the Squire read the map and fit out a ship; a one-legged cook offers to come along."
    },
    "threshold": {
      "q": "What is the moment of leaving that cannot be undone?",
      "e": "Crossing the threshold is the hero's first step into the story's new world.",
      "x": "The Hispaniola weighs anchor and Jim is at sea for the first time in his life."
    },
    "tests": {
      "q": "Who turns out to be a friend, who an enemy, and what does the hero learn the hard way?",
      "e": "Tests, allies and enemies is the stretch where the new world teaches its rules.",
      "x": "In the apple barrel Jim overhears Long John Silver planning the mutiny."
    },
    "approach": {
      "q": "What does the hero prepare for, and what do they fear meeting there?",
      "e": "The approach is the gathering of nerve before the story's central danger.",
      "x": "Jim slips ashore on the island and meets Ben Gunn, the marooned man."
    },
    "ordeal": {
      "q": "What is the greatest fear faced, and what seems lost in facing it?",
      "e": "The ordeal is the central crisis, where the hero confronts death or its equivalent.",
      "x": "Alone on the drifting Hispaniola, Jim faces Israel Hands and the knife that pins his shoulder."
    },
    "reward": {
      "q": "What does the hero take from the ordeal, and at what price?",
      "e": "The reward is what the ordeal earns, often with a cost attached.",
      "x": "Jim beaches the ship in a hidden cove: the pirates have lost their only way home."
    },
    "road-back": {
      "q": "What drives the hero back toward home, and what pursues them?",
      "e": "The road back turns the story toward the return, with the danger following.",
      "x": "Jim stumbles into the stockade and finds the pirates holding it; Silver keeps him alive."
    },
    "resurrection": {
      "q": "What final test shows the hero has truly changed?",
      "e": "The resurrection is the last ordeal, passed by the new self rather than the old.",
      "x": "At the empty cache the pirates turn on Silver and Jim, and the friends' ambush saves them."
    },
    "return": {
      "q": "What does the hero bring back, and what does home look like now?",
      "e": "The return shows the hero home with what the journey won, changed by the winning.",
      "x": "Jim sails home with his share of the treasure, and the island still visits his dreams."
    }
  },
  "story-circle": {
    "you": {
      "q": "Who is your protagonist in their comfort zone, and what is ordinary about it?",
      "e": "\"You\" establishes the character at rest, before wanting anything badly.",
      "x": "Elizabeth Bennet at Longbourn, laughing with Jane at the neighbours."
    },
    "need": {
      "q": "What do they want, and what would happen if they never got it?",
      "e": "\"Need\" is the desire that pulls the character out of the comfort zone.",
      "x": "She wants a marriage she can respect, in a house where marriage is the only career."
    },
    "go": {
      "q": "What unfamiliar situation do they step into?",
      "e": "\"Go\" is the crossing into a world that works differently.",
      "x": "The Netherfield ball, and Mr Darcy's circle, where she is judged and judges back."
    },
    "search": {
      "q": "What do they struggle with and learn while adapting?",
      "e": "\"Search\" is the adapting, where the character is tested and picks up what they'll need.",
      "x": "Wickham's stories, Mr Collins's proposal, Charlotte's practical marriage."
    },
    "find": {
      "q": "What do they get that looks like what they wanted?",
      "e": "\"Find\" is getting the thing, often in a form that proves hollow.",
      "x": "Darcy proposes: the richest offer she will ever have, made in the proudest words."
    },
    "take": {
      "q": "What does it cost them, and what do they lose?",
      "e": "\"Take\" is paying the price for what was found.",
      "x": "His letter costs her the certainty that she had read everyone rightly."
    },
    "return": {
      "q": "How do they go back, and what is different about going back?",
      "e": "\"Return\" brings the character home to the familiar world as someone altered.",
      "x": "Lydia's elopement calls her home; the family's disgrace is now also hers to carry."
    },
    "change": {
      "q": "How are they different, and how does that change their world?",
      "e": "\"Change\" shows the new self acting where the old self couldn't.",
      "x": "She accepts Darcy knowing what she misjudged, and Longbourn's fortunes turn with her."
    }
  },
  "scene-sequel": {
    "goal": {
      "q": "What does your character want by the end of this scene?",
      "e": "The goal is the concrete thing the character tries to get within the scene.",
      "x": "Marta wants to hand her brother's letter to the ferry captain before the boat leaves."
    },
    "conflict": {
      "q": "What stands in the way, and how does it fight back?",
      "e": "The conflict is the opposition that makes the goal hard to reach.",
      "x": "A deckhand won't let anyone aboard without a ticket, and the gangway is already lifting."
    },
    "disaster": {
      "q": "How does the scene end worse than it began?",
      "e": "The disaster is the scene's ending, where the goal is missed or won at a cost.",
      "x": "The ferry pulls out with the letter still in her hand."
    },
    "reaction": {
      "q": "How does your character feel, in their body, right after?",
      "e": "The reaction is the emotional beat after the disaster, before any thinking.",
      "x": "She sits on a bollard with the letter crushed in her fist, shaking."
    },
    "dilemma": {
      "q": "What are the bad options now, and why is none of them good?",
      "e": "The dilemma is the choice between poor options that the disaster has left.",
      "x": "Wait a week for the next boat, pay a stranger to chase it, or open the letter herself."
    },
    "decision": {
      "q": "What do they choose, and what new goal does it set?",
      "e": "The decision is the choice that ends the sequel and becomes the next scene's goal.",
      "x": "She hires a fisherman to run her out to the ferry's first stop."
    }
  },
  "argument-essay": {
    "claim": {
      "q": "What do you believe, in one sentence a reader could disagree with?",
      "e": "The claim is the essay's position, stated so plainly that it can be argued against.",
      "x": "The town should close Main Street to cars every Sunday morning."
    },
    "counterclaim": {
      "q": "What would the smartest person who disagrees say?",
      "e": "The counterclaim is the best opposing case, taken seriously before it is answered.",
      "x": "Shops on Main Street depend on Sunday drivers who stop on impulse."
    },
    "evidence-1": {
      "q": "What is the strongest fact or example for your claim?",
      "e": "Evidence is the fact, example or testimony that makes the claim more than an opinion.",
      "x": "Foot traffic doubled on the two trial Sundays, by the chamber of commerce's own count."
    },
    "evidence-2": {
      "q": "What second kind of evidence supports it from another angle?",
      "e": "A second piece of evidence from a different kind of source strengthens the case.",
      "x": "The three cafés on the street reported their best Sunday takings of the year."
    },
    "evidence-3": {
      "q": "What evidence answers the counterclaim directly?",
      "e": "Evidence aimed at the counterclaim turns the opposition's point into support.",
      "x": "The hardware store's drivers parked one street over and still came."
    },
    "synthesis": {
      "q": "How do the pieces fit together into one argument?",
      "e": "Synthesis shows how the evidence and the answered counterclaim add up to the claim.",
      "x": "More people, longer visits and no lost customers: the street works better without the cars."
    },
    "so-what": {
      "q": "Why should a reader who doesn't live here care?",
      "e": "The so-what gives the argument a reach beyond its own case.",
      "x": "Every town has a street that could be a room on Sundays."
    }
  },
  "research-paper": {
    "introduction": {
      "q": "What is known, what isn't, and what question does this paper answer?",
      "e": "The introduction moves from what the field knows to the gap this paper fills.",
      "x": "Studies show plants calm offices; none has tested a classroom during a timed task."
    },
    "methods": {
      "q": "What did you do, exactly, so someone else could repeat it?",
      "e": "Methods is the procedure in enough detail to be reproduced.",
      "x": "Two classes, one with twelve plants and one without, the same twenty-minute attention test, four weeks."
    },
    "results": {
      "q": "What did you find, before you say what it means?",
      "e": "Results reports the findings as data, with no interpretation.",
      "x": "The plant class scored eleven per cent higher in weeks three and four; weeks one and two were level."
    },
    "discussion": {
      "q": "What do the results mean, what are their limits, and what comes next?",
      "e": "Discussion interprets the results, names what they cannot show and points to the next study.",
      "x": "The gap appears only after two weeks, which suggests habit rather than novelty; two classes is a small sample."
    },
    "abstract": {
      "q": "In five sentences, what did you ask, do, find and conclude?",
      "e": "The abstract is the whole paper in a paragraph, written after the rest so it can be true.",
      "x": "One sentence each for the question, the method, the result and the meaning."
    }
  },
  "business-proposal": {
    "problem": {
      "q": "What problem does your reader have, in their words?",
      "e": "The problem is the reader's pain, stated the way they would state it.",
      "x": "Regulars say they run out of bread midweek and the shop is closed when they finish work."
    },
    "solution": {
      "q": "What do you propose, and how does it solve exactly that problem?",
      "e": "The solution is the proposal, matched point for point to the problem.",
      "x": "A paid weekly box of three loaves, left in a locker the customer opens with a code."
    },
    "market": {
      "q": "Who wants this, how many of them are there, and how do you know?",
      "e": "The market is the evidence that enough people want the solution.",
      "x": "Forty regulars said yes on a counter survey; two hundred live within a mile."
    },
    "ask": {
      "q": "What do you need from the reader, exactly?",
      "e": "The ask is the specific decision or resource the proposal requests.",
      "x": "Permission to install two lockers by the door and a loan for the first month's flour."
    },
    "timeline": {
      "q": "What happens when, from yes to running?",
      "e": "The timeline is the plan in dates, so the reader can picture it happening.",
      "x": "Lockers in two weeks, twenty subscribers in a month, break-even by the third."
    },
    "budget": {
      "q": "What does it cost, and what does it return?",
      "e": "The budget is the money in and out, honestly, with the return the reader cares about.",
      "x": "Eight hundred for lockers; sixty subscribers cover it in nine weeks."
    },
    "objections": {
      "q": "What will the reader worry about, and what is your answer to each?",
      "e": "Objections is the reader's doubts, answered before they are raised.",
      "x": "Theft from the lockers: codes expire at midnight, and the first month is insured."
    }
  },
  "from-my-pages": {
    "page": {
      "q": "What does this part do for the whole?",
      "e": "A reverse outline looks at what you already wrote and names what each part is doing.",
      "x": "Five scenes written out of order; the card for the kettle scene says \"she decides to stay.\""
    },
    "gaps": {
      "q": "What connects this part to the next?",
      "e": "The gaps readout lists the parts with nothing yet, and the Tutor can ask what joins two neighbours.",
      "x": "Between scene three and scene four, nothing says how she got to the harbour."
    }
  }
};

function entry(deck: string, step: string): StepContent | undefined {
  return DECK_CONTENT[deck]?.[step];
}

// The question a dealt card carries at deal time. `variant` is the answer id for a step whose question varies; an unknown variant falls back to the record's first entry (a deck's own default).
export function stepQuestion(deck: string, step: string, variant?: string): string {
  const q = entry(deck, step)?.q;
  if (q === undefined) return '';
  if (typeof q === 'string') return q;
  return (variant !== undefined && q[variant]) || Object.values(q)[0] || '';
}
export function stepExplain(deck: string, step: string): string { return entry(deck, step)?.e ?? ''; }
export function stepExample(deck: string, step: string): string { return entry(deck, step)?.x ?? ''; }
export function hasStepContent(deck: string, step: string): boolean { return !!entry(deck, step); }
