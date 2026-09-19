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

  if(context.goal==='emergency_reserve')floor=Math.max(floor,60);
  if(context.principal_required==='yes')floor=Math.max(floor,35);
  else if(context.principal_required==='unsure')floor=Math.max(floor,15);
  return round5(clamp(floor,5,80));
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

function horizonReason(value:string|null|undefined){
  if(value==='lt_1y')return 'Your money may be needed within one year, so the blueprint keeps market exposure very limited.';
  if(value==='1_3y')return 'A 1–3 year horizon limits how much short-term market loss this goal can reasonably absorb.';
  if(value==='3_5y')return 'A 3–5 year horizon allows some growth exposure while keeping timing risk visible.';
  if(value==='5_10y')return 'A 5–10 year horizon allows more room for market cycles without ignoring this goal’s constraints.';
  if(value==='gt_10y')return 'A 10+ year horizon gives the most room for long-term market exposure.';
  return 'Time horizon is treated as a core boundary for this blueprint.';
}

function liquidityReason(value:string|null|undefined){
  if(value==='high')return 'High access needs keep a larger liquid reserve and cap market exposure.';
  if(value==='medium')return 'Some access matters, so the blueprint keeps a dedicated liquidity buffer.';
  if(value==='low')return 'Low near-term access needs allow more of this money to stay invested.';
  return 'Liquidity needs remain visible in the allocation.';
}

function principalReason(value:string|null|undefined){
  if(value==='yes')return 'You said the full amount must be available when needed, so the blueprint does not add equity exposure for this goal.';
  if(value==='unsure')return 'Because principal protection is uncertain, the blueprint applies a conservative cap rather than assuming loss capacity.';
  return 'You said full principal protection is not required, so market exposure can be considered within your other limits.';
}

function isGrowthBlocked(context:BlueprintContextInput){
  return context.principal_required==='yes'||context.goal==='emergency_reserve'||context.time_horizon==='lt_1y';
}

export function buildPortfolioBlueprint(dna:BlueprintDNAInput,context?:BlueprintContextInput|null):PortfolioBlueprint|null{
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
        title:'More Defensive',
        subtitle:'Less market exposure and a larger stability buffer.',
        allocation:defensive,
        constrained:false,
      },
      {
        key:'core',
        title:'Your Core Blueprint',
        subtitle:'Closest to your current Investor DNA and goal constraints.',
        allocation:core,
        constrained:false,
      },
      {
        key:'growth',
        title:'More Growth',
        subtitle:growthConstrained?'Your current goal limits how far this scenario can move toward growth.':'More market exposure with more short-term fluctuation.',
        allocation:growth,
        constrained:growthConstrained,
        ...(growthConstrained?{constraintNote:growthBlocked
          ?'Not expanded beyond your Core Blueprint because principal protection, emergency-reserve use or a sub-one-year horizon is a hard constraint.'
          :'Growth exposure is capped by your current horizon, liquidity or preservation constraints.'}:{}),
      },
    ],
    reasons:[
      `Risk willingness and financial capacity produce a guarded risk anchor of ${Math.round(riskAnchor)}/100.`,
      horizonReason(context.time_horizon),
      liquidityReason(context.liquidity_need),
      principalReason(context.principal_required),
    ],
    note:'Educational asset-class blueprint only. Fixed income can lose value, cash can lose purchasing power, and this does not select securities or guarantee an outcome.',
  };
}
