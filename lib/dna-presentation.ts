import {humanize} from '@/lib/dna';

export type PresentationLocale='en'|'fr';

/**
 * Pure presentation metadata/helpers for the Investor DNA report.
 *
 * These functions translate already-computed DNA values into display labels and
 * narrative snippets. They are NOT scoring logic and must never be used by the
 * canonical assessment/Match engine.
 */
export const ARCHETYPES:Record<string,{title:string;tagline:string}>={
 VAULT:{title:'Protect today. Compound tomorrow.',tagline:'Protection comes first, and your current financial capacity also calls for caution.'},
 ANCHOR:{title:'Stay steady. Build with balance.',tagline:'You prefer a steadier path, with room for measured investment risk.'},
 COOLHAND:{title:'Calm mind. Steady progress.',tagline:'Your finances can absorb more risk than you naturally prefer to take.'},
 SCOUT:{title:'Look ahead. Find opportunities.',tagline:'You are open to some risk, while your current financial capacity calls for restraint.'},
 MAVERICK:{title:'Your path. Your perspective.',tagline:'Your comfort with risk and financial capacity are broadly balanced.'},
 STRIKER:{title:'Turn insight into action.',tagline:'You are comfortable with meaningful risk and currently have more room to absorb it.'},
 HOTSHOT:{title:'Embrace the ride. Go further.',tagline:'Your willingness to take risk is higher than the financial room you currently have to absorb losses.'},
 HIGHROLLER:{title:'Explore more. Navigate with purpose.',tagline:'You are comfortable taking significant risk with moderate financial capacity behind it.'},
 JACKPOT:{title:"Challenge more. Shape what's next.",tagline:'Both your willingness and your current capacity for investment risk are relatively high.'}
};

/**
 * Friendly display names. Canonical backend archetype keys remain unchanged so
 * assessment/scoring contracts and historical data do not need a migration.
 */
export const ARCHETYPES_FR:Record<string,{title:string;tagline:string}>={
 VAULT:{title:'Protéger aujourd’hui. Faire croître demain.',tagline:'La protection passe d’abord, et votre capacité financière actuelle appelle aussi à la prudence.'},
 ANCHOR:{title:'Rester stable. Construire avec équilibre.',tagline:'Vous préférez une trajectoire plus stable, avec une place pour un risque mesuré.'},
 COOLHAND:{title:'Esprit calme. Progression régulière.',tagline:'Vos finances peuvent absorber plus de risque que vous préférez naturellement en prendre.'},
 SCOUT:{title:'Regarder devant. Trouver des occasions.',tagline:'Vous êtes ouvert à un certain risque, tandis que votre capacité financière actuelle appelle à la retenue.'},
 MAVERICK:{title:'Votre chemin. Votre perspective.',tagline:'Votre confort face au risque et votre capacité financière sont globalement équilibrés.'},
 STRIKER:{title:'Transformer l’analyse en action.',tagline:'Vous êtes à l’aise avec un risque significatif et disposez actuellement de plus de marge pour l’absorber.'},
 HOTSHOT:{title:'Accepter les mouvements. Aller plus loin.',tagline:'Votre volonté de prendre du risque dépasse la marge financière dont vous disposez actuellement pour absorber des pertes.'},
 HIGHROLLER:{title:'Explorer davantage. Avancer avec intention.',tagline:'Vous êtes à l’aise avec un risque important, soutenu par une capacité financière modérée.'},
 JACKPOT:{title:'Aller plus loin. Façonner la suite.',tagline:'Votre volonté et votre capacité actuelle à assumer le risque de placement sont toutes deux relativement élevées.'}
};

export const ARCHETYPE_DISPLAY_NAMES:Record<string,string>={
 VAULT:'VAULT',
 ANCHOR:'ANCHOR',
 COOLHAND:'COOLHAND',
 SCOUT:'SCOUT',
 MAVERICK:'MAVERICK',
 STRIKER:'STRIKER',
 HOTSHOT:'CHARGER',
 HIGHROLLER:'PATHFINDER',
 JACKPOT:'VANGUARD'
};

export function displayArchetype(value?:string|null){
 const key=(value||'MAVERICK').toUpperCase();
 return ARCHETYPE_DISPLAY_NAMES[key]||key;
}

export const BEHAVIOR:Record<string,{label:string;help:string;high:string;mid:string;low:string}>={
 decision_independence:{label:'Decision independence',help:'How much you separate other people’s excitement from your own decision.',high:'Independent',mid:'Mixed',low:'More socially influenced'},
 long_term_orientation:{label:'Long-term orientation',help:'How well you keep recent performance in perspective.',high:'Long-term focused',mid:'Mixed',low:'More performance-sensitive'},
 reference_flexibility:{label:'Reference flexibility',help:'How easily you look past the price you paid and reassess from today.',high:'Flexible',mid:'Mixed',low:'More anchored to past prices'},
 evidence_discipline:{label:'Evidence discipline',help:'How willing you are to test your view against new evidence.',high:'Evidence-led',mid:'Mixed',low:'More conviction-led'},
 emotional_decision_control:{label:'Emotional decision control',help:'How well you keep stress and regret from taking over the decision.',high:'Composed',mid:'Mixed',low:'More emotion-sensitive'}
};

};

export const BEHAVIOR_FR:Record<string,{label:string;help:string;high:string;mid:string;low:string}>={
 decision_independence:{label:'Indépendance décisionnelle',help:'Dans quelle mesure vous séparez l’enthousiasme des autres de votre propre décision.',high:'Indépendant',mid:'Mixte',low:'Plus influencé socialement'},
 long_term_orientation:{label:'Orientation long terme',help:'Dans quelle mesure vous gardez les rendements récents en perspective.',high:'Axé long terme',mid:'Mixte',low:'Plus sensible au rendement récent'},
 reference_flexibility:{label:'Flexibilité des repères',help:'Dans quelle mesure vous pouvez dépasser le prix payé et réévaluer à partir d’aujourd’hui.',high:'Flexible',mid:'Mixte',low:'Plus ancré aux prix passés'},
 evidence_discipline:{label:'Discipline face aux preuves',help:'Dans quelle mesure vous êtes prêt à tester votre point de vue face à de nouvelles preuves.',high:'Guidé par les preuves',mid:'Mixte',low:'Plus guidé par la conviction'},
 emotional_decision_control:{label:'Contrôle émotionnel des décisions',help:'Dans quelle mesure vous empêchez le stress et le regret de prendre le dessus.',high:'Calme',mid:'Mixte',low:'Plus sensible aux émotions'}
};

export const RISK_MATRIX=[
 ['COOLHAND','STRIKER','JACKPOT'],
 ['ANCHOR','MAVERICK','HIGHROLLER'],
 ['VAULT','SCOUT','HOTSHOT']
];

export function riskBand(value:unknown,locale:PresentationLocale='en'){
 const score=typeof value==='number'?value:NaN;
 if(!Number.isFinite(score))return locale==='fr'?'Non disponible':'Not available';
 if(score<40)return locale==='fr'?'Faible':'Lower';
 if(score<70)return locale==='fr'?'Modéré':'Moderate';
 return locale==='fr'?'Élevé':'Higher';
}

export function behaviorBand(key:string,value:unknown,locale:PresentationLocale='en'){
 const score=typeof value==='number'?value:NaN;
 const meta=(locale==='fr'?BEHAVIOR_FR:BEHAVIOR)[key];
 if(!meta||!Number.isFinite(score))return locale==='fr'?'Non disponible':'Not available';
 if(score>=70)return meta.high;
 if(score>=45)return meta.mid;
 return meta.low;
}

export function riskRelationship(tolerance:unknown,capacity:unknown,locale:PresentationLocale='en'){
 const riskTolerance=typeof tolerance==='number'?tolerance:NaN;
 const riskCapacity=typeof capacity==='number'?capacity:NaN;
 if(!Number.isFinite(riskTolerance)||!Number.isFinite(riskCapacity))return '';

 const difference=riskCapacity-riskTolerance;
 if(difference>=15){
  return locale==='fr'?'Vos finances peuvent absorber plus de risque que vous êtes naturellement à l’aise d’en prendre.':'Your finances can absorb more risk than you naturally feel comfortable taking.';
 }
 if(difference<=-15){
  return locale==='fr'?'Votre volonté de prendre du risque dépasse la marge financière dont vous disposez actuellement pour absorber des pertes.':'Your willingness to take risk is running ahead of the financial room you currently have to absorb losses.';
 }
 return locale==='fr'?'Votre confort face au risque et votre capacité financière sont raisonnablement proches.':'Your comfort with risk and your financial capacity are reasonably close to one another.';
}

export function formatInvestmentContext(key:string,value:unknown,locale:PresentationLocale='en'){
 if(value===null||value===undefined||value==='')return locale==='fr'?'Non fourni':'Not provided';
 const mapsEn:Record<string,Record<string,string>>={
  goal:{
   growth:'Long-term growth',
   retirement:'Retirement',
   house_purchase:'Home purchase',
   major_purchase:'Major purchase',
   education:'Education',
   income:'Regular investment income',
   wealth_preservation:'Wealth preservation',
   preservation:'Wealth preservation',
   emergency_reserve:'Emergency reserve / protect near-term money'
  },
  time_horizon:{
   under_2:'Under 2 years',
   lt_1y:'Less than 1 year',
   '1_3y':'1–3 years',
   '2_5':'2–5 years',
   '3_5y':'3–5 years',
   '5_10':'5–10 years',
   '5_10y':'5–10 years',
   '10_plus':'More than 10 years',
   gt_10y:'More than 10 years'
  },
  liquidity_need:{
   very_high:'Very high — immediate access matters',
   high:'High — easy access matters',
   medium:'Medium — some access matters',
   low:'Low — can stay invested'
  },
  principal_required:{
   yes:'Yes — full amount must be protected',
   no:'No — market loss can be accepted at that time',
   unsure:'Not sure yet'
  }
 };
 const mapsFr:Record<string,Record<string,string>>={
  goal:{growth:'Croissance à long terme',retirement:'Retraite',house_purchase:'Achat d’une propriété',major_purchase:'Achat important',education:'Études',income:'Revenu de placement régulier',wealth_preservation:'Préservation du patrimoine',preservation:'Préservation du patrimoine',emergency_reserve:'Fonds d’urgence / protéger l’argent à court terme'},
  time_horizon:{under_2:'Moins de 2 ans',lt_1y:'Moins de 1 an','1_3y':'1 à 3 ans','2_5':'2 à 5 ans','3_5y':'3 à 5 ans','5_10':'5 à 10 ans','5_10y':'5 à 10 ans','10_plus':'Plus de 10 ans',gt_10y:'Plus de 10 ans'},
  liquidity_need:{very_high:'Très élevé — accès immédiat important',high:'Élevé — accès facile important',medium:'Moyen — un certain accès est important',low:'Faible — peut rester investi'},
  principal_required:{yes:'Oui — le montant total doit être protégé',no:'Non — une perte de marché peut être acceptée à ce moment-là',unsure:'Pas encore certain'}
 };
 const maps=locale==='fr'?mapsFr:mapsEn;
 return maps[key]?.[String(value)]||humanize(String(value));
}

export function standoutDecision(behavioral:Record<string,number>,locale:PresentationLocale='en'){
 const candidates=locale==='fr'?[
  {key:'decision_independence',low:'Plus réceptif socialement',high:'Esprit indépendant',lowText:'L’enthousiasme des autres peut attirer votre attention vers un placement avant la fin de votre propre analyse.',highText:'Vous avez tendance à séparer l’enthousiasme des autres de votre propre décision de placement.'},
  {key:'long_term_orientation',low:'Sensible au rendement récent',high:'Axé long terme',lowText:'Les gagnants et retardataires récents peuvent modifier l’attrait que vous percevez dans un placement.',highText:'Vous avez tendance à garder le rendement récent en perspective et à rester concentré sur le cas à long terme.'},
  {key:'reference_flexibility',low:'Sensible aux repères',high:'Tourné vers l’avenir',lowText:'Le prix payé peut rester influent lorsque vous décidez de la suite.',highText:'Vous avez tendance à réévaluer les placements à partir d’aujourd’hui plutôt qu’à rester ancré au prix d’achat initial.'},
  {key:'evidence_discipline',low:'Guidé par la conviction',high:'Guidé par les preuves',lowText:'Une fois une idée appréciée, il peut falloir des preuves plus fortes pour changer votre point de vue.',highText:'Vous êtes relativement disposé à tester une idée préférée face à de nouvelles preuves ou à des preuves contradictoires.'}
 ]:[
  {key:'decision_independence',low:'More socially responsive',high:'Independent-minded',lowText:'Other people’s excitement can pull your attention toward an investment before your own review is finished.',highText:'You tend to separate other people’s enthusiasm from your own investment decision.'},
  {key:'long_term_orientation',low:'Performance-sensitive',high:'Long-term focused',lowText:'Recent winners and laggards can change how attractive an investment feels to you.',highText:'You tend to keep recent performance in perspective and stay focused on the longer-term case.'},
  {key:'reference_flexibility',low:'Reference-sensitive',high:'Forward-looking',lowText:'The price you paid can remain influential when you decide what to do next.',highText:'You tend to reassess investments from today forward rather than staying anchored to the original purchase price.'},
  {key:'evidence_discipline',low:'Conviction-led',high:'Evidence-led',lowText:'Once you like an idea, changing your view can take stronger evidence.',highText:'You are relatively willing to test a favored idea against new or conflicting evidence.'}
 ];

 const ranked=candidates
  .map(candidate=>({...candidate,value:Number(behavioral[candidate.key])}))
  .filter(candidate=>Number.isFinite(candidate.value))
  .sort((a,b)=>Math.abs(b.value-50)-Math.abs(a.value-50));

 const top=ranked[0];
 if(!top||Math.abs(top.value-50)<15){
  return locale==='fr'?{label:'Équilibré',text:'Aucune tendance décisionnelle ne domine fortement. Vous semblez combiner vos propres critères, les preuves et votre expérience.'}:{label:'Balanced',text:'No single decision tendency dominates strongly. You appear to use a mix of your own criteria, evidence and experience.'};
 }
 return top.value<50
  ? {label:top.low,text:top.lowText}
  : {label:top.high,text:top.highText};
}

export function pressureInsight(value:unknown,locale:PresentationLocale='en'){
 const score=typeof value==='number'?value:NaN;
 if(!Number.isFinite(score)){
  return locale==='fr'?{label:'Données insuffisantes',text:'Nous n’avons pas encore assez d’information pour décrire comment la pression des marchés peut influencer vos décisions.'}:{label:'Not enough data',text:'We do not have enough information yet to describe how market pressure may affect your decisions.'};
 }
 if(score>=70){
  return locale==='fr'?{label:'Calme',text:'Les mouvements brusques du marché sont moins susceptibles de vous éloigner d’un plan choisi dans le calme.'}:{label:'Composed',text:'Sharp market moves are less likely to pull you away from a plan you chose while calm.'};
 }
 if(score<40){
  return locale==='fr'?{label:'Plus sensible aux émotions',text:'Les mouvements brusques du marché ou le regret peuvent créer une envie plus forte de changer de cap plus tôt que prévu.'}:{label:'More emotion-sensitive',text:'Sharp market moves or regret may create a stronger urge to change course sooner than you intended.'};
 }
 return locale==='fr'?{label:'Mesuré',text:'Le stress des marchés peut parfois vous affecter, mais il ne semble pas dominer votre processus décisionnel.'}:{label:'Measured',text:'Market stress may affect you at times, but it does not appear to dominate your decision process.'};
}


export function archetypeMeta(key:string,locale:PresentationLocale='en'){
 return (locale==='fr'?ARCHETYPES_FR:ARCHETYPES)[key];
}
export function behaviorMeta(key:string,locale:PresentationLocale='en'){
 return (locale==='fr'?BEHAVIOR_FR:BEHAVIOR)[key];
}
