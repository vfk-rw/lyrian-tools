Thank you to every one of you, who have the time to make Lyrian Chronicles more accessible on Roll20.




Mordivandros’s Attacks 18.Mar.2025:
Remember to fill in Focus and Power attributes first, so the Macros function correctly. This one also seems to be missing the Heavy-weighted Melee Attack. These Macros are global Macros, create these Macros in the Macros Settings. (The Three Dice next to the Settings Icon in the Chat Menu)

Light Attack:
&{template:default}{{name= @{Selected|Token_Name} Light Attack}}{{Light Attack:=[[1d20+@{Selected|Focus}]]}}{{Damage Dealt:=[[1d4+@{Selected|Power}]]}}

Heavy Attack:
&{template:default}{{name= @{Selected|Token_Name} Heavy Attack}}{{Heavy Attack:=[[1d20+@{Selected|Focus}]]}}{{Damage Dealt:=[[2d6+@{Selected|Power}*2]]}}

Precise Attack:
&{template:default}{{name= @{Selected|Token_Name} Precise Attack}}{{Precise Attack:=[[1d20+@{Selected|Focus}*2]]}}{{Damage Dealt:=[[1d4+@{Selected|Power}]]}}

Heavy Weapon - Heavy Attack:
&{template:default}{{name= @{Selected|Token_Name} Heavy Weapon Heavy Attack}}{{Heavy Attack:=[[1d20+@{Selected|Focus}]]}}{{Damage Dealt:=[[2d8+@{Selected|Power}*2]]}}

This makes a template for your characters and monsters features, copy this  under abilities. 15.Apr.2025:

Grab
&{template:default} {{name=@{name} ❖ Grab}} {{Keywords:=Root}} {{Range:=5ft}} {{Cost:=1 AP}} {{Description:=You make a Light attack against the target. On damage, you and the target are both Rooted. 

The target may spend 1 AP to break free, after which the target and you are both no longer rooted. If the target is grabbed by multiple enemies through this ability, spending the 1 AP will free it from all grabs.}}




Ya Boshi’s Codes 1.Apr.2025:
Here are the Roll20 macros, made for Roll20 games. Put these macros into the sheets directly for them to work.

Light Attack:
&{template:default} {{name=@{name} ❖ Light Attack (1 AP)}} {{To Hit: [[1d20+@{focus}]]}} {{Damage: [[1d4+@{power}]]}}

Heavy Attack:
&{template:default} {{name=@{name} ❖ Heavy Attack (2 AP)}} {{To Hit: [[1d20+@{focus}]]}} {{Damage: ?{Light or Heavy Weapon?|Light, [[2d6+(2*@{power})]]|Heavy, [[2d8+(2*@{power})]]}}}

Precise Attack:
&{template:default} {{name=@{name} ❖ Precise Attack (2 AP)}} {{To Hit: [[1d20+(2*@{focus})]]}} {{Damage: [[1d4+@{power}]]}}

Initiative (if you have a token selected while using this macro- it also automatically adds the selected token to the Initiative Order with the result rolled):
&{template:default} {{name=@{name} ❖ Initiative}} {{Result: [[(1d4+(@{agility}-@{armor_penalty}))&{tracker}]]}}

Passive Defenses (Calculates the Passive Defenses - Evasion & Guard - and pushes to the chat):
&{template:default} {{name=@{name} ❖ Passive Defenses}} {{Evasion: [[7+(@{agility}-@{armor_penalty})]]}} {{Guard: [[floor(@{toughness}/2)+@{armor_passive}]]}}

Active Defenses (Calculates the Active Defenses(Dodge & Block) and pushes to the chat):
&{template:default} {{name=@{name} ❖ Active Defenses (1 RP)}} {{Dodge: [[15+(2*(@{agility}-@{armor_penalty}))]]}} {{Block: [[@{toughness}+@{armor_active}]]}}

Make Save (Makes a d20 roll with Toughness added):
&{template:default} {{name=@{name} ❖ Saving Throw}} {{Result: [[1d20+@{toughness}]]}}

Potency (Calculates character Potency and pushes to the chat):
&{template:default} {{name=@{name} ❖ Potency}} {{Potency: [[10+@{focus}]]}}

The above macros require the following attributes to function (case sensitive):
 name
focus
power
agility
toughness
armor_penalty
armor_active
armor_passive

The following is an advanced macro and requires the following additional attributes (case sensitive):
fitness
cunning
reason
awareness
presence
acrobatics_sp
athletics_sp
riding_sp
stealth_sp
deception_sp
roguecraft_sp
medicine_sp
common_knowledge_sp
linguistics_sp
magic_sp
religion_sp
appraisal_sp
history_sp
flight_sp
artifice_sp
perception_sp
insight_sp
survival_sp
animal_husbandry_sp
art_sp
negotiation_sp
intimidation_sp

Advanced Macro: Skill Check (Queries as skill, and rolls a d20 plus relevant sub-stat and sp). COPY EVERYTHING BENEATH THIS INTO ONE MACRO:
?{Skill being used?
|Acrobatics, ~~Acrobatics Check~~ Result: [[1d20+@{fitness}+@{acrobatics_sp}]]
|Athletics, ~~Athletics Check~~ Result: [[1d20+@{fitness}+@{athletics_sp}]]
|Riding, ~~Riding Check~~ Result: [[1d20+@{fitness}+@{riding_sp}]]
|Stealth, ~~Stealth Check~~ Result: [[1d20+@{cunning}+@{stealth_sp}]]
|Deception, ~~Deception Check~~ Result: [[1d20+@{cunning}+@{deception_sp}]]
|Roguecraft, ~~Roguecraft Check~~ Result: [[1d20+@{cunning}+@{roguecraft_sp}]]
|Medicine, ~~Medicine Check~~ Result: [[1d20+@{reason}+@{medicine_sp}]]
|Common Knowledge, ~~Common Knowledge Check~~ Result: [[1d20+@{reason}+@{common_knowledge_sp}]]
|Linguistics, ~~Linguistics Check~~ Result: [[1d20+@{reason}+@{linguistics_sp}]]
|Magic, ~~Magic Check~~ Result: [[1d20+@{reason}+@{magic_sp}]]
|Religion, ~~Religion Check~~ Result: [[1d20+@{reason}+@{religion_sp}]]
|Artisan, ~~Appraisal Check~~ Result: [[1d20+@{reason}+@{appraisal_sp}]]
|History, ~~History Check~~ Result: [[1d20+@{reason}+@{history_sp}]]
|Flight, ~~Flight Check~~ Result: [[1d20+@{reason}+@{flight_sp}]]
|Artifice, ~~Artifice Check~~ Result: [[1d20+@{reason}+@{artifice_sp}]]
|Perception, ~~Perception Check~~ Result: [[1d20+@{awareness}+@{perception_sp}]]
|Insight, ~~Insight Check~~ Result: [[1d20+@{awareness}+@{insight_sp}]]
|Survival, ~~Survival Check~~ Result: [[1d20+@{awareness}+@{survival_sp}]]
|Animal Husbandry, ~~Animal Husbandry Check~~ Result: [[1d20+@{awareness}+@{animal_husbandry_sp}]]
|Art, ~~Art Check~~ Result: [[1d20+@{presence}+@{art_sp}]]
|Negotiation, ~~Negotiation Check~~ Result: [[1d20+@{presence}+@{negotiation_sp}]]
|Intimidation, ~~Intimidation Check~~ Result: [[1d20+@{presence}+@{intimidation_sp}]]
}



Vito Gunnhilder’s Short-Hands 4.Apr.2025:
These codes are a consolidation of the others’ codes above. Basically, I made it easier to use! Be aware that you need to first set up your Attributes before doing most of these, and then fill these codes in for your Abilities.

Attributes Column to Fill-In:
HP ; MP ; RP ; AP
Speed ; Burden ; Initiative ; Save_Bonus;
Evasion ; Dodge ; Guard ; Block
Armor_Passive ; Armor_Active ; Armor_Penalty
Focus ; Power ; Agility ; Toughness
Fitness ; Cunning ; Reason ; Awareness ; Presence
Acrobatics_SP ; Athletics_SP ; Riding_SP
Stealth_SP ; Deception_SP ; Roguecraft_SP
Medicine_SP ; Common_Knowledge_SP ; Linguistics_SP ; Magic_SP ; Religion_SP ; Appraisal_SP ; History_SP ; Flight_SP ; Artifice_SP
Perception_SP ; Insight_SP ; Survival_SP ; Animal_Husbandry_SP
Art_SP ; Negotiation_SP ; Intimidation_SP
“_Cartography_EXP_” ; or “_Alchemy_CP_”

–

Abilities Column to Fill-In:

Offensive Options:
&{template:default} {{name=___ ❖ Offensive Options}} {{?{Light, Heavy, HEAVY, or Precise?
|Light, Light Attack: [[1d20+@{focus}]] Damage: [[1d4+@{power}]]
|Heavy, Heavy Attack: [[1d20+@{focus}]] Damage: [[2d6+(2*@{power})]]
|HEAVY, HEAVY-Melee Attack: [[1d20+@{focus}]] Damage: [[2d8+(2*@{power})]]
|Precise, Precise Attack: [[1d20+(2*@{focus})]] Damage: [[1d4+@{power}]]
}}}


Defensive Options:
&{template:default} {{name=___ ❖ Defensive Options}} {{?{Passive or Active?
|Passive Defenses, **Evasion:** [[7+(@{agility}-@{armor_penalty})]]
**Guard:** [[floor(@{toughness}/2)+@{armor_passive}]]
|Active Defenses, **Dodge:** [[15+(2*(@{agility}-@{armor_penalty}))]]
**Block:** [[@{toughness}+@{armor_active}]]
}}}

Skill Options:
&{template:default} {{name=___ ❖ Skills Options}} {{?{Choose the relevant Skill...
|Acrobatics, **~~Acrobatics Check~~ Result:** [[1d20+@{fitness}+@{acrobatics_sp}]]
|Athletics, **~~Athletics Check~~ Result:** [[1d20+@{fitness}+@{athletics_sp}]]
|Riding, **~~Riding Check~~ Result:** [[1d20+@{fitness}+@{riding_sp}]]
|Stealth, **~~Stealth Check~~ Result:** [[1d20+@{cunning}+@{stealth_sp}]]
|Deception, **~~Deception Check~Skills Options~ Result:** [[1d20+@{cunning}+@{deception_sp}]]
|Roguecraft, **~~Roguecraft Check~~ Result:** [[1d20+@{cunning}+@{roguecraft_sp}]]
|Medicine, **~~Medicine Check~~ Result:** [[1d20+@{reason}+@{medicine_sp}]]
|Common Knowledge, **~~Common Knowledge Check~~ Result:** [[1d20+@{reason}+@{common_knowledge_sp}]]
|Linguistics, **~~Linguistics Check~~ Result:** [[1d20+@{reason}+@{linguistics_sp}]]
|Magic, **~~Magic Check~~ Result:** [[1d20+@{reason}+@{magic_sp}]]
|Religion, **~~Religion Check~~ Result:** [[1d20+@{reason}+@{religion_sp}]]
|Appraisal, **~~Appraisal Check~~ Result:** [[1d20+@{reason}+@{appraisal_sp}]]
|History, **~~History Check~~ Result:** [[1d20+@{reason}+@{history_sp}]]
|Flight, **~~Flight Check~~ Result:** [[1d20+@{reason}+@{flight_sp}]]
|Artifice, **~~Artifice Check~~ Result:** [[1d20+@{reason}+@{artifice_sp}]]
|Perception, **~~Perception Check~~ Result:** [[1d20+@{awareness}+@{perception_sp}]]
|Insight, **~~Insight Check~~ Result:** [[1d20+@{awareness}+@{insight_sp}]]
|Survival, **~~Survival Check~~ Result:** [[1d20+@{awareness}+@{survival_sp}]]
|Animal Husbandry, **~~Animal Husbandry Check~~ Result:** [[1d20+@{awareness}+@{animal_husbandry_sp}]]
|Art, **~~Art Check~~ Result:** [[1d20+@{presence}+@{art_sp}]]
|Negotiation, **~~Negotiation Check~~ Result:** [[1d20+@{presence}+@{negotiation_sp}]]
|Intimidation, **~~Intimidation Check~~ Result:** [[1d20+@{presence}+@{intimidation_sp}]]
}}}

Note: Add this for Expertise! Place it above the “}}}”.
|Expertise: “___”, **~~“___” Check~~ Result:** [[1d20+@{“_attribute_”}+@{“_skill_sp_”}+@{“_expertise_sp_”}]]

Take Initiative:
&{template:default} {{name=___ ❖ Initiative}} {{Result: [[1d4+@{initiative}&{tracker}]]}}

Saving Throw:
&{template:default} {{name=___ ❖ Saving}} {{Result: [[1d20+@{save_bonus}]]}}

Potency:
&{template:default} {{name=___ ❖ Potency}} {{Potency: [[10+@{attribute: focus}]]}}

Abilities Cards:
&{template:default} {{name=___ ❖ “_Ability_Name_”}}
**Keywords:** Instant.
**Range:** Self.
**Cost:** 0 RP.
**Requirement:** None.
**Description:** **Fight:** *You immediately gain 2 AP that can be used on basic abilities, but lose 1 RP.* **Flight:** *You immediately gain 1 RP, but recover 2 less AP on your next turn. You regain the use of this ability after the Encounter Conclusion phase.*

—

Premade Ancestral Cards:

Human - Divine Providence.
&{template:default} {{name=Human ❖ Divine Providence}}
**Keywords:** None.
**Range:** Self.
**Cost:** 0 RP.
**Requirement:** Human.
**Description:** *When you use this ability you choose one of the following effects. Once you use this ability, you may not use it again until after a rest.*
?{Choose one of the following effects...
|Divine Protection, *Divine Protection: You are protected from harm through divine protection.* **Damage Reduction:** [[100]]
|Fortune, *Fortune: This ability becomes Instant. Reroll your last d20 and take the new result.* **Reroll d20:** [[1d20]]
|Health, *Health: You heal someone (or yourself) within touching distance.* **Heal:** [[10]]
|Light, *Light: You summon a bright light at your position that shines a bright light up to 30ft around you. You may detonate this light immediately or at any other time.* **Illumination Distance:** [[30]] with Daze effect on detonation
}

Human - Human Adaptability.
&{template:default} {{name=Human ❖ Human Adaptability}}
**Keywords:** None.
**Range:** None.
**Cost:** None.
**Requirement:** Human.
**Description:** *Once per interlude phase you may refund an ability and choose to learn another ability. You cannot pick an ability that makes you ineligible for any of your prerequisites.*

Phoenix - Elemental Mastery: Fire.
&{template:default} {{name=Phoenix ❖ Elemental Mastery: Fire}}
**Keywords:** None.
**Range:** None.
**Cost:** None.
**Requirement:** Phoenix.
**Description:** *You gain Elemental Mastery: Fire.*

Phoenix - Phoenix Tears.
&{template:default} {{name=Phoenix ❖ Phoenix Tears}}
**Keywords:** Encounter Conclusion.
**Range:** Touch.
**Cost:** 1 Encounter Conclusion Action.
**Requirement:** Phoenix.
**Description:** *At the end of combat you may use 1 Encounter Conclusion action to heal a single target other than yourself for Power and prevent one injury on them.*

Phoenix - Fiery Rebirth.
&{template:default} {{name=Phoenix ❖ Fiery Rebirth}}
**Keywords:** Downed.
**Range:** Self.
**Cost:** 5 MP, 0 RP.
**Requirement:** Phoenix. You've suffered a mortal wound.
**Description:** *You regain HP until you are at 1 HP. Then, stand up from prone and deal Light full pierce fire damage to all enemies within 5ft of you. After using this ability, the mortal wound condition is removed from you and you cannot use Fiery Rebirth again for the rest of the arc.* **Set HP Value:** [[1]] **Light Attack:** [[1d20+@{focus}]] **Fire Damage:** [[1d4+@{power}]] *with Full Pierce.*

Chimera - Fight or Flight.
&{template:default} {{name=Chimera ❖ Fight or Flight}}
**Keywords:** Instant.
**Range:** Self.
**Cost:** 0 RP.
**Requirement:** Chimera.
**Description:** **Fight:** *You immediately gain 2 AP that can be used on basic abilities, but lose 1 RP.* **Flight:** *You immediately gain 1 RP, but recover 2 less AP on your next turn. You regain the use of this ability after the Encounter Conclusion phase.*
?{Will you Fight or Flight?
|Fight, **Fight!** **RP Cost:** [[1]] **AP Gain:** [[2]]
|Flight, **Flight!** **AP Cost (next round):** [[2]] **RP Gain:** [[1]]
}

Rabbitfolk - Instinct.
&{template:default} {{name=Rabbitfolk ❖ Instinct}}
**Keywords:** None.
**Range:** None.
**Cost:** None.
**Requirement:** Rabbitfolk. Triggering Stealth attack, or Action.
**Description:** *The first time per encounter that you are attacked by a Stealth attack, you may still react to it. In addition, when you are about to take an action that leads to grave harm or death (example: The enemy has an instant death ability), you can receive a premonition from the DM.*
**RP Cost:** [[1]] **Evasion:** [[7+(@{agility}-@{armor_penalty})]] **Guard:** [[floor(@{toughness}/2)+@{armor_passive}]] **Dodge:** [[15+(2*(@{agility}-@{armor_penalty}))]] **Block:** [[@{toughness}+@{armor_active}]]

Rabbitfolk - Escape Artist.
&{template:default} {{name=Rabbitfolk ❖ Escape Artist}}
**Keywords:** None.
**Range:** Self.
**Cost:** 1 AP or 1 RP.
**Requirement:** You are grappled.
**Description:** *You immediately escape the grapple by twisting and kicking. May be used by spending either AP or RP.*
?{Which cost will you pay?
|1 AP, **AP Cost:** [[1]] to Remove Grapple.
|1 RP, **RP Cost:** [[1]] to Remove Grapple.
}

More to add.

–

Premade Class Cards:

Fighter - Charge.
&{template:default} {{name=Fighter ❖ Charge}}
**Keywords:** None.
**Range:** Self.
**Cost:** 2 / 4 AP.
**Requirement:** None.
**Description:** *You may spend 2 or 4 AP on this ability and move as though you had spent that AP on movement. After you finish moving, you may spend half of the AP you used on this ability on Light or Heavy Melee Attacks.*
?{How much AP will you use?
|2 AP, **AP Cost:** [[2]] Movement: [[2*@{Speed}]]
**To-Hit:** [[1d20+@{focus}]] **Light Damage:** [[1d4+@{power}]]
|4 AP Heavy, **AP Cost:** [[4]] Movement: [[4*@{speed}]]
**To-Hit:** [[1d20+@{focus}]] **Heavy Damage:** [[2d6+(2*@{power})]]
|4 AP Light x2, **AP Cost:** [[4]] Movement: [[4*@{speed}]]
**1st To-Hit:** [[1d20+@{focus}]] **Light Damage:** [[1d4+@{power}]]
**2nd To-Hit:** [[1d20+@{focus}]] **Light Damage:** [[1d4+@{power}]]
}

Fighter - Power Strike.
&{template:default} {{name=Fighter ❖ Power Strike}}
**Keywords:** None.
**Range:** Melee Weapon Range.
**Cost:** 2 AP, and X MP.
**Requirement:** None.
**Description:** You attack a single target for Heavy Damage. Add 2 per Mana you spent on this to the damage. You can spend a maximum of 5 Mana on this ability.
?{How much Mana will you spend?
|1, **Mana Cost:** [[1]] **To-Hit:** [[1d20+@{focus}]] **Heavy Damage:** [[2d6+(2*@{power})+2]]
|2, **Mana Cost:** [[2]] **To-Hit:** [[1d20+@{focus}]] **Heavy Damage:** [[2d6+(2*@{power})+4]]
|3, **Mana Cost:** [[3]] **To-Hit:** [[1d20+@{focus}]] **Heavy Damage:** [[2d6+(2*@{power})+6]]
|4, **Mana Cost:** [[4]] **To-Hit:** [[1d20+@{focus}]] **Heavy Damage:** [[2d6+(2*@{power})+8]]
|5, **Mana Cost:** [[5]] **To-Hit:** [[1d20+@{focus}]] **Heavy Damage:** [[2d6+(2*@{power})+10]]
}

Fighter - Slam.
&{template:default} {{name=Fighter ❖ Slam}}
**Keywords:** None.
**Range:** Melee Weapon Range.
**Cost:** 1 AP.
**Requirement:** None.
**Description:** You attack a single target for Light Damage. On damage, the target is moved 5ft away from you if they are a Grunt or if your Power is higher than theirs. In addition, the target must be no more than twice your size.
**Power:** [[@{power}]] **To-Hit:** [[1d20+@{focus}]] **Light Damage:** [[1d4+@{power}]]

Fighter - Defensive Flexibility.
&{template:default} {{name=Fighter ❖ Defensive Flexibility}}
**Keywords:** None.
**Range:** Self.
**Cost:** 0 RP.
**Requirement:** None.
**Description:** You must use this immediately after taking the Dodge or Block action. You automatically react to the next attack targeted at you before the start of your next turn with the opposite action that you last took. If your last action was the Dodge action, you automatically react with Block. If your last action was the Block action, you automatically react with Dodge. You may cancel the effect of Defensive Flexibility at any time for 0 RP.
?{0 RP, Block or Dodge?
|Block, **RP Cost:** [[0]] **Block:** [[@{toughness}+@{armor_active}]]
|Dodge, **RP Cost:** [[0]] **Dodge:** [[15+(2*(@{agility}-@{armor_penalty}))]]
}

More to add.

—

Sample Image of GM-Notes for Enemies:



NOTE: DO NOT ADD THESE CODES TO THE MACRO-TAB. PUT THEM UNDER ABILITIES.







