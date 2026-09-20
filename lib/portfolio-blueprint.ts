export const PORTFOLIO_BLUEPRINT_VERSION='portfolio-blueprint-v1';

export type BlueprintDNAInput={
  risk_tolerance?:number;
  risk_capacity?:number;
};

export type BlueprintContextInput={
  goal?:string|null;
  time_horizon?:string|null;
  liquidity_need?:string|null;
  principal_required?:string|null;
};

export type Allocation={
  equity:number;
  fixedIncome:number;
  cash:number;
};

export type BlueprintScenario={
  key:'defensive'|'core'|'growth';
  title:string;
  subtitle:string;
  allocation:Allocation;
  constrained:boolean;
  constraintNote?:string;
};

export type PortfolioBlueprint={
  version:string;
  riskAnchor:number;
  scenarios:BlueprintScenario[];
  reasons:string[];
  note:string;
};

const clamp=(value:number,min=0,max=100)=>Math.max(min,Math.min(max,value));
const round5=(value:number)=>Math.round(value/5)*5;

function scoreOrNull(value:unknown){
  return typeof value==='number'&&Number.isFinite(value)?clamp(value):null;
}

function baseEquity(anchor:number){
  if(anchor<25)return 20;
  if(anchor<40)return 30;
  if(anchor<55)return 45;
  if(anchor<70)return 60;
  if(anchor<85)return 75;
  return 85;
}

function horizonCap(value:string|null|undefined){
  if(value==='lt_1y')return 0;
  if(value==='1_3y')return 25;
  if(value==='3_5y')return 45;
  if(value==='5_10y')return 70;
  if(value==='gt_10y')return 90;
  return 50;
}

function liquidityCap(value:string|null|undefined){
  if(value==='high')return 40;
  if(value==='medium')return 75;
  if(value==='low')return 90;
  return 50;
}

function goalCap(value:string|null|undefined){
  if(value==='emergency_reserve')return 0;
  if(value==='wealth_preservation'||value==='preservation')return 35;
  if(value==='income')return 50;
  return 90;
}

function principalCap(value:string|null|undefined){
  if(value==='yes')return 0;
  if(value==='unsure')return 40;
  return 90;
}

function cashFloor(context:BlueprintContextInput){
  let floor=5;
  if(context.time_horizon==='lt_1y')floor=Math.max(floor,50);
  else if(context.time_horizon==='1_3y')floor=Math.max(floor,20);
  else if(context.time_horizon==='3_5y')floor=Math.max(floor,10);

  if(context.liquidity_need==='high')floor=Math.max(floor,15);
  else if(context.liquidity_need==='medium')floor=Math.max(floor,5);

  if(context.goal==='emergency_reserve')floor=100;
  if(context.principal_required==='yes')floor=100;
  else if(context.principal_required==='unsure')floor=Math.max(floor,15);
  return round5(clamp(floor,5,100));
}

function allocation(equity:number,cash:number):Allocation{
  const safeEquity=round5(clamp(equity));
  const safeCash=round5(clamp(cash,0,100-safeEquity));
  return {
    equity:safeEquity,
    fixedIncome:100-safeEquity-safeCash,
    cash:safeCash,
  };
}

function horizonReason(value:string|null|undefined,locale:'en'|'fr'='en'){
  if(value==='lt_1y')return locale==='fr'?'Cet argent pourrait être nécessaire dans moins d’un an; le blueprint garde donc l’exposition au marché très limitée.':'Your money may be needed within one year, so the blueprint keeps market exposure very limited.';
  if(value==='1_3y')return locale==='fr'?'Un horizon de 1 à 3 ans limite la perte de marché à court terme que cet objectif peut raisonnablement absorber.':'A 1–3 year horizon limits how much short-term market loss this goal can reasonably absorb.';
  if(value==='3_5y')return locale==='fr'?'Un horizon de 3 à 5 ans permet une certaine exposition à la croissance tout en gardant le risque de calendrier visible.':'A 3–5 year horizon allows some growth exposure while keeping timing risk visible.';
  if(value==='5_10y')return locale==='fr'?'Un horizon de 5 à 10 ans laisse davantage de place aux cycles de marché sans ignorer les contraintes de cet objectif.':'A 5–10 year horizon allows more room for market cycles without ignoring this goal’s constraints.';
  if(value==='gt_10y')return locale==='fr'?'Un horizon de plus de 10 ans laisse le plus de place à l’exposition à long terme au marché.':'A 10+ year horizon gives the most room for long-term market exposure.';
  return locale==='fr'?'L’horizon est traité comme une limite principale de ce blueprint.':'Time horizon is treated as a core boundary for this blueprint.';
}

function liquidityReason(value:string|null|undefined,locale:'en'|'fr'='en'){
  if(value==='high')return locale==='fr'?'Des besoins d’accès élevés maintiennent une réserve liquide plus importante et plafonnent l’exposition au marché.':'High access needs keep a larger liquid reserve and cap market exposure.';
  if(value==='medium')return locale==='fr'?'Un certain accès est important; le blueprint maintient donc une réserve de liquidité dédiée.':'Some access matters, so the blueprint keeps a dedicated liquidity buffer.';
  if(value==='low')return locale==='fr'?'De faibles besoins d’accès à court terme permettent à une plus grande partie de cet argent de rester investie.':'Low near-term access needs allow more of this money to stay invested.';
  return locale==='fr'?'Les besoins de liquidité restent visibles dans la répartition.':'Liquidity needs remain visible in the allocation.';
}

function principalReason(value:string|null|undefined,locale:'en'|'fr'='en'){
  if(value==='yes')return locale==='fr'?'Vous avez indiqué que le montant total doit être disponible au moment voulu; le blueprint n’ajoute donc pas d’exposition aux actions pour cet objectif.':'You said the full amount must be available when needed, so the blueprint does not add equity exposure for this goal.';
  if(value==='unsure')return locale==='fr'?'Comme la protection du capital est incertaine, le blueprint applique un plafond prudent plutôt que de supposer une capacité de perte.':'Because principal protection is uncertain, the blueprint applies a conservative cap rather than assuming loss capacity.';
  return locale==='fr'?'Vous avez indiqué qu’une protection complète du capital n’est pas requise; une exposition au marché peut donc être envisagée dans vos autres limites.':'You said full principal protection is not required, so market exposure can be considered within your other limits.';
}

function isGrowthBlocked(context:BlueprintContextInput){
  return context.principal_required==='yes'||context.goal==='emergency_reserve'||context.time_horizon==='lt_1y';
}

export function buildPortfolioBlueprint(dna:BlueprintDNAInput,context?:BlueprintContextInput|null,locale:'en'|'fr'='en'):PortfolioBlueprint|null{
  if(!context?.goal||!context.time_horizon||!context.liquidity_need||!context.principal_required)return null;

  const tolerance=scoreOrNull(dna.risk_tolerance);
  const capacity=scoreOrNull(dna.risk_capacity);
  if(tolerance==null||capacity==null)return null;

  // Financial capacity is a ceiling, not a bonus. Willingness alone should not
  // push the core allocation past what the current financial capacity can absorb.
  const riskAnchor=Math.min(tolerance,capacity);
  const equityCeiling=Math.min(
    horizonCap(context.time_horizon),
    liquidityCap(context.liquidity_need),
    goalCap(context.goal),
    principalCap(context.principal_required)
  );

  const minimumCash=cashFloor(context);
  const coreEquity=round5(Math.min(baseEquity(riskAnchor),equityCeiling,100-minimumCash));
  const core=allocation(coreEquity,minimumCash);

  const defensiveEquity=round5(Math.max(0,core.equity-15));
  const defensiveCash=round5(Math.min(100-defensiveEquity,Math.max(minimumCash,core.cash+5)));
  const defensive=allocation(defensiveEquity,defensiveCash);
  const defensiveConstrained=
    defensive.equity===core.equity &&
    defensive.fixedIncome===core.fixedIncome &&
    defensive.cash===core.cash;

  const growthBlocked=isGrowthBlocked(context);
  const growthEquity=round5(Math.min(core.equity+15,equityCeiling,100-minimumCash));
  const growth=allocation(growthBlocked?core.equity:growthEquity,minimumCash);
  const growthConstrained=growthBlocked||growth.equity<=core.equity;

  return {
    version:PORTFOLIO_BLUEPRINT_VERSION,
    riskAnchor,
    scenarios:[
      {
        key:'defensive',
        title:locale==='fr'?'Plus défensif':'More Defensive',
        subtitle:locale==='fr'?'Moins d’exposition au marché et une réserve de stabilité plus importante.':'Less market exposure and a larger stability buffer.',
        allocation:defensive,
        constrained:defensiveConstrained,
        ...(defensiveConstrained?{constraintNote:locale==='fr'?'Les contraintes actuelles de protection et de liquidité placent déjà le Blueprint principal à la limite la plus défensive utilisée par ce modèle.':'The current protection/liquidity constraints already place the Core Blueprint at the most defensive boundary used by this model.'}:{}),
      },
      {
        key:'core',
        title:locale==='fr'?'Votre Blueprint principal':'Your Core Blueprint',
        subtitle:locale==='fr'?'Le plus proche de votre Investor DNA actuel et des contraintes de votre objectif.':'Closest to your current Investor DNA and goal constraints.',
        allocation:core,
        constrained:false,
      },
      {
        key:'growth',
        title:locale==='fr'?'Plus de croissance':'More Growth',
        subtitle:growthConstrained?(locale==='fr'?'Votre objectif actuel limite la mesure dans laquelle ce scénario peut aller vers la croissance.':'Your current goal limits how far this scenario can move toward growth.'):(locale==='fr'?'Plus d’exposition au marché avec davantage de fluctuations à court terme.':'More market exposure with more short-term fluctuation.'),
        allocation:growth,
        constrained:growthConstrained,
        ...(growthConstrained?{constraintNote:growthBlocked
          ? (locale==='fr'?'Non étendu au-delà de votre Blueprint principal, car la protection du capital, l’utilisation comme fonds d’urgence ou un horizon de moins d’un an constitue une contrainte forte.':'Not expanded beyond your Core Blueprint because principal protection, emergency-reserve use or a sub-one-year horizon is a hard constraint.')
          : (locale==='fr'?'L’exposition à la croissance est plafonnée par vos contraintes actuelles d’horizon, de liquidité ou de préservation.':'Growth exposure is capped by your current horizon, liquidity or preservation constraints.')}:{}),
      },
    ],
    reasons:[
      locale==='fr'?`La volonté de prendre du risque et la capacité financière produisent un repère de risque prudent de ${Math.round(riskAnchor)}/100.`:`Risk willingness and financial capacity produce a guarded risk anchor of ${Math.round(riskAnchor)}/100.`,
      horizonReason(context.time_horizon,locale),
      liquidityReason(context.liquidity_need,locale),
      principalReason(context.principal_required,locale),
    ],
    note:locale==='fr'?'Blueprint éducatif par catégorie d’actif seulement. Le revenu fixe peut perdre de la valeur, les liquidités peuvent perdre du pouvoir d’achat, et ceci ne sélectionne aucun titre ni ne garantit un résultat.':'Educational asset-class blueprint only. Fixed income can lose value, cash can lose purchasing power, and this does not select securities or guarantee an outcome.',
  };
}
