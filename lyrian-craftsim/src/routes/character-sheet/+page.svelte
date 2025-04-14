<script lang="ts">
  import { onMount } from 'svelte';

  // Sample character data for mockup
  const character = {
    // Basic Info
    name: "Vajra",
    race: "Youkai",
    subrace: "Raijin",
    gender: "Male",
    age: "240",
    height: "6ft 1in",
    weight: "180lbs",
    
    // Character progression
    exp: 50,
    spiritCore: 1250,
    interludePoints: 0,
    startingBreakthrough: 300,
    breakthroughRemaining: 0,
    
    // Main Stats
    mainStats: {
      focus: 4,
      power: 6,
      agility: 4,
      toughness: 4
    },
    
    // Sub Stats
    subStats: {
      fitness: 5,
      cunning: 1,
      reason: 4,
      awareness: 4,
      presence: 3
    },
    
    // Combat Stats
    combatStats: {
      hp: 40,
      mana: 12,
      initiative: 4,
      rp: 6,
      lightDamage: "1d4+5",
      heavyDamage: "2d6+10",
      evasion: 11,
      guard: 2,
      saveBonus: 4,
      dodge: 23,
      block: 4,
      potency: 14,
      speed: 20,
      hpBonus: 0,
      burden: 0
    },
    
    // Skills organized by related stat
    skills: [
      { name: "Acrobatics", stat: "Fitness", value: 9, expertises: [] },
      { name: "Athletics", stat: "Fitness", value: 6, expertises: [{ name: "Athletics", value: 1 }] },
      { name: "Riding", stat: "Fitness", value: 5, expertises: [{ name: "Riding", value: 0 }] },
      
      { name: "Stealth", stat: "Cunning", value: 1, expertises: [{ name: "Stealth", value: 0 }] },
      { name: "Deception", stat: "Cunning", value: 1, expertises: [{ name: "Deception", value: 0 }] },
      { name: "Roguecraft", stat: "Cunning", value: 1, expertises: [{ name: "Roguecraft", value: 0 }] },
      
      { name: "Medicine", stat: "Reason", value: 4, expertises: [{ name: "Medicine", value: 0 }] },
      { name: "Common Knowledge", stat: "Reason", value: 4, expertises: [{ name: "Common Knowledge", value: 0 }] },
      { name: "Linguistics", stat: "Reason", value: 4, expertises: [{ name: "Linguistics", value: 0 }] },
      { name: "Magic", stat: "Reason", value: 6, expertises: [{ name: "Wind Magic", value: 2 }] },
      { name: "Religion", stat: "Reason", value: 4, expertises: [{ name: "Religion", value: 0 }] },
      { name: "Appraise", stat: "Reason", value: 4, expertises: [{ name: "Appraise", value: 0 }] },
      { name: "History", stat: "Reason", value: 4, expertises: [{ name: "Kiraran History", value: 2 }] },
      { name: "Flight", stat: "Reason", value: 4, expertises: [{ name: "Flight", value: 0 }] },
      { name: "Artifice", stat: "Reason", value: 4, expertises: [{ name: "Artifice", value: 0 }] },
      
      { name: "Perception", stat: "Awareness", value: 6, expertises: [{ name: "Perception", value: 2 }] },
      { name: "Insight", stat: "Awareness", value: 5, expertises: [{ name: "Insight", value: 1 }] },
      { name: "Survival", stat: "Awareness", value: 4, expertises: [{ name: "Survival", value: 0 }] },
      { name: "Animal Husbandry", stat: "Awareness", value: 4, expertises: [{ name: "Animal Husbandry", value: 0 }] },
      
      { name: "Art", stat: "Presence", value: 3, expertises: [{ name: "Drawing", value: 4 }] },
      { name: "Negotiation", stat: "Presence", value: 6, expertises: [{ name: "Negotiation", value: 3 }] },
      { name: "Intimidation", stat: "Presence", value: 3, expertises: [{ name: "Intimidation", value: 0 }] }
    ],
    
    // Classes
    classes: [
      { name: "Electromancer", tier: 2, level: 8, cost: 900 },
      { name: "Battle Mage", tier: 2, level: 2, cost: 300 }
    ],
    
    // Proficiencies
    proficiencies: [
      "Channeling (While Weapon Swap)",
      "Polearms",
      "Light Swords",
      "Longswords",
      "Small Weapons",
      "Kiraran Language",
      "Common Language"
    ],
    
    // Crafting Skills
    craftingSkills: [
      { name: "Blacksmithing", value: 0 },
      { name: "Alchemy", value: 0 }
    ],
    
    // Equipment
    weapons: [
      { 
        name: "Light Polearm", 
        lightAttack: { accuracy: 4, damage: "1d4+5" }, 
        heavyAttack: { accuracy: 4, damage: "2d6+10" }, 
        preciseAttack: { accuracy: 4, damage: "1d4+5" } 
      },
      { 
        name: "Longsword (Light)", 
        lightAttack: { accuracy: 4, damage: "1d4+5" }, 
        heavyAttack: { accuracy: 4, damage: "2d6+10" }, 
        preciseAttack: { accuracy: 4, damage: "1d4+5" } 
      },
      { 
        name: "Longsword (Heavy)", 
        lightAttack: { accuracy: 4, damage: "1d4+5" }, 
        heavyAttack: { accuracy: 4, damage: "2d8+10" }, 
        preciseAttack: { accuracy: 4, damage: "1d4+5" } 
      }
    ],
    armor: [
      { name: "Light Mage Armor", passiveBonus: 0, activeBonus: 0, penalty: 0 },
      { name: "Medium Mage Armor", passiveBonus: 0, activeBonus: 0, penalty: 0 },
      { name: "Heavy Mage Armor", passiveBonus: 0, activeBonus: 0, penalty: 0 },
      { name: "Longsword (Shield)", passiveBonus: 0, activeBonus: 0, penalty: 0 }
    ]
  };

  // Define section types for type safety
  type SectionKey = 'basicInfo' | 'stats' | 'combat' | 'skills' | 'classes' | 'equipment' | 'proficiencies';

  // Collapsed state for each section
  let collapsedSections: Record<SectionKey, boolean> = {
    basicInfo: false,
    stats: false,
    combat: false,
    skills: false,
    classes: false,
    equipment: false,
    proficiencies: false
  };

  // Toggle section collapse
  function toggleSection(section: SectionKey) {
    collapsedSections[section] = !collapsedSections[section];
  }

  onMount(() => {
    // Any initialization code can go here
  });
</script>

<div class="character-sheet-container">
  <div class="sheet-header">
    <h1>Character Sheet</h1>
    <p class="description">Interactive character management for Lyrian Chronicles</p>
  </div>

  <!-- Basic Character Information -->
  <div class="section-card">
    <div class="section-header" on:click={() => toggleSection('basicInfo')}>
      <h2>Character Information</h2>
      <span class="collapse-icon">{collapsedSections.basicInfo ? '▼' : '▲'}</span>
    </div>
    {#if !collapsedSections.basicInfo}
      <div class="section-content basic-info-grid">
        <div class="info-group">
          <label for="name">Name:</label>
          <input type="text" id="name" value="{character.name}" readonly />
        </div>
        <div class="info-group">
          <label for="race">Race:</label>
          <input type="text" id="race" value="{character.race}" readonly />
        </div>
        <div class="info-group">
          <label for="subrace">Sub-Race:</label>
          <input type="text" id="subrace" value="{character.subrace}" readonly />
        </div>
        <div class="info-group">
          <label for="gender">Gender:</label>
          <input type="text" id="gender" value="{character.gender}" readonly />
        </div>
        <div class="info-group">
          <label for="age">Age:</label>
          <input type="text" id="age" value="{character.age}" readonly />
        </div>
        <div class="info-group">
          <label for="height">Height:</label>
          <input type="text" id="height" value="{character.height}" readonly />
        </div>
        <div class="info-group">
          <label for="weight">Weight:</label>
          <input type="text" id="weight" value="{character.weight}" readonly />
        </div>
        <div class="info-group">
          <label for="exp">EXP:</label>
          <input type="text" id="exp" value="{character.exp}" readonly />
        </div>
        <div class="info-group">
          <label for="spirit-core">Spirit Core:</label>
          <input type="text" id="spirit-core" value="{character.spiritCore}" readonly />
        </div>
        <div class="info-group">
          <label for="interlude-points">Interlude Points:</label>
          <input type="text" id="interlude-points" value="{character.interludePoints}" readonly />
        </div>
      </div>
    {/if}
  </div>

  <!-- Character Stats -->
  <div class="section-card">
    <div class="section-header" on:click={() => toggleSection('stats')}>
      <h2>Character Stats</h2>
      <span class="collapse-icon">{collapsedSections.stats ? '▼' : '▲'}</span>
    </div>
    {#if !collapsedSections.stats}
      <div class="section-content">
        <div class="stats-container">
          <div class="stats-group">
            <h3>Main Stats</h3>
            <div class="stats-grid main-stats">
              <div class="stat-item focus">
                <label for="focus">Focus</label>
                <div class="stat-value">{character.mainStats.focus}</div>
              </div>
              <div class="stat-item power">
                <label for="power">Power</label>
                <div class="stat-value">{character.mainStats.power}</div>
              </div>
              <div class="stat-item agility">
                <label for="agility">Agility</label>
                <div class="stat-value">{character.mainStats.agility}</div>
              </div>
              <div class="stat-item toughness">
                <label for="toughness">Toughness</label>
                <div class="stat-value">{character.mainStats.toughness}</div>
              </div>
            </div>
          </div>
          
          <div class="stats-group">
            <h3>Sub Stats</h3>
            <div class="stats-grid sub-stats">
              <div class="stat-item fitness">
                <label for="fitness">Fitness</label>
                <div class="stat-value">{character.subStats.fitness}</div>
              </div>
              <div class="stat-item cunning">
                <label for="cunning">Cunning</label>
                <div class="stat-value">{character.subStats.cunning}</div>
              </div>
              <div class="stat-item reason">
                <label for="reason">Reason</label>
                <div class="stat-value">{character.subStats.reason}</div>
              </div>
              <div class="stat-item awareness">
                <label for="awareness">Awareness</label>
                <div class="stat-value">{character.subStats.awareness}</div>
              </div>
              <div class="stat-item presence">
                <label for="presence">Presence</label>
                <div class="stat-value">{character.subStats.presence}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Combat Stats -->
  <div class="section-card">
    <div class="section-header" on:click={() => toggleSection('combat')}>
      <h2>Combat Information</h2>
      <span class="collapse-icon">{collapsedSections.combat ? '▼' : '▲'}</span>
    </div>
    {#if !collapsedSections.combat}
      <div class="section-content">
        <div class="combat-stats-container">
          <div class="combat-column">
            <h3>Core Combat Stats</h3>
            <div class="combat-grid">
              <div class="combat-stat-item">
                <label>HP</label>
                <div class="combat-stat-value">{character.combatStats.hp}</div>
              </div>
              <div class="combat-stat-item">
                <label>Mana</label>
                <div class="combat-stat-value">{character.combatStats.mana}</div>
              </div>
              <div class="combat-stat-item">
                <label>Initiative</label>
                <div class="combat-stat-value">{character.combatStats.initiative}</div>
              </div>
              <div class="combat-stat-item">
                <label>RP</label>
                <div class="combat-stat-value">{character.combatStats.rp}</div>
              </div>
              <div class="combat-stat-item">
                <label>Light Damage</label>
                <div class="combat-stat-value">{character.combatStats.lightDamage}</div>
              </div>
              <div class="combat-stat-item">
                <label>Heavy Damage</label>
                <div class="combat-stat-value">{character.combatStats.heavyDamage}</div>
              </div>
            </div>
          </div>
          
          <div class="combat-column">
            <h3>Defensive Stats</h3>
            <div class="combat-grid">
              <div class="combat-stat-item">
                <label>Evasion</label>
                <div class="combat-stat-value">{character.combatStats.evasion}</div>
              </div>
              <div class="combat-stat-item">
                <label>Guard</label>
                <div class="combat-stat-value">{character.combatStats.guard}</div>
              </div>
              <div class="combat-stat-item">
                <label>Save Bonus</label>
                <div class="combat-stat-value">{character.combatStats.saveBonus}</div>
              </div>
              <div class="combat-stat-item">
                <label>Dodge</label>
                <div class="combat-stat-value">{character.combatStats.dodge}</div>
              </div>
              <div class="combat-stat-item">
                <label>Block</label>
                <div class="combat-stat-value">{character.combatStats.block}</div>
              </div>
              <div class="combat-stat-item">
                <label>Burden</label>
                <div class="combat-stat-value">{character.combatStats.burden}</div>
              </div>
            </div>
          </div>
          
          <div class="combat-column">
            <h3>Combat Modifiers</h3>
            <div class="combat-grid">
              <div class="combat-stat-item">
                <label>Potency</label>
                <div class="combat-stat-value">{character.combatStats.potency}</div>
              </div>
              <div class="combat-stat-item">
                <label>Speed</label>
                <div class="combat-stat-value">{character.combatStats.speed}</div>
              </div>
              <div class="combat-stat-item">
                <label>HP Bonus</label>
                <div class="combat-stat-value">{character.combatStats.hpBonus}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Skills -->
  <div class="section-card">
    <div class="section-header" on:click={() => toggleSection('skills')}>
      <h2>Skills & Expertise</h2>
      <span class="collapse-icon">{collapsedSections.skills ? '▼' : '▲'}</span>
    </div>
    {#if !collapsedSections.skills}
      <div class="section-content">
        <div class="skill-points-summary">
          <div class="skill-point-item">
            <span>Skill Points:</span>
            <span class="skill-point-value">4</span>
          </div>
          <div class="skill-point-item">
            <span>Expertise Points:</span>
            <span class="skill-point-value">0</span>
          </div>
        </div>
        
        <!-- Group skills by stat -->
        {#each ['Fitness', 'Cunning', 'Reason', 'Awareness', 'Presence'] as statCategory}
          <div class="skill-category">
            <h3>{statCategory}</h3>
            <div class="skills-list">
              {#each character.skills.filter(skill => skill.stat === statCategory) as skill}
                <div class="skill-item">
                  <div class="skill-name-value">
                    <span class="skill-name">{skill.name}</span>
                    <span class="skill-value">{skill.value}</span>
                  </div>
                  {#if skill.expertises.length > 0}
                    <div class="expertise-list">
                      {#each skill.expertises as expertise}
                        {#if expertise.value > 0}
                          <div class="expertise-item">
                            <span class="expertise-name">{expertise.name}</span>
                            <span class="expertise-value">{expertise.value}</span>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .character-sheet-container {
    width: 95%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .sheet-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .sheet-header h1 {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .description {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
  
  .section-card {
    background-color: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
  }
  
  .section-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }
  
  .collapse-icon {
    font-size: 1rem;
    color: #6b7280;
  }
  
  .section-content {
    padding: 1.5rem;
  }
  
  .basic-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  
  .info-group {
    display: flex;
    flex-direction: column;
  }
  
  .info-group label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: #4b5563;
  }
  
  .info-group input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background-color: #f9fafb;
  }
  
  .stats-container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
  }
  
  .stats-group {
    flex: 1;
    min-width: 250px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stat-item {
    padding: 0.75rem;
    background-color: #f9fafb;
    border-radius: 0.25rem;
    border-left: 3px solid #3b82f6;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    margin-top: 0.5rem;
  }
  
  .combat-stats-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  
  .combat-column {
    flex: 1;
    min-width: 250px;
  }
  
  .combat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .combat-stat-item {
    background-color: #f9fafb;
    padding: 0.75rem;
    border-radius: 0.25rem;
    text-align: center;
  }
  
  .combat-stat-value {
    font-size: 1.25rem;
    font-weight: bold;
    margin-top: 0.25rem;
  }
  
  .skill-points-summary {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;
    background-color: #f9fafb;
    padding: 1rem;
    border-radius: 0.25rem;
  }
  
  .skill-category {
    margin-bottom: 1.5rem;
  }
  
  .skills-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
  }
  
  .skill-item {
    background-color: #f9fafb;
    padding: 0.75rem;
    border-radius: 0.25rem;
  }
  
  .skill-name-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .skill-value {
    font-weight: bold;
  }
  
  .expertise-list {
    margin-top: 0.5rem;
    padding-left: 1rem;
  }
  
  .expertise-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #4b5563;
    padding: 0.25rem 0;
  }
</style>
