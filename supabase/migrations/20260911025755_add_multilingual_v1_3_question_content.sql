BEGIN;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS language_code text NOT NULL DEFAULT 'en' CHECK (language_code IN ('en','fr','fa'));
ALTER TABLE public.pilot_participants ADD COLUMN IF NOT EXISTS language_code text NOT NULL DEFAULT 'en' CHECK (language_code IN ('en','fr','fa'));
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS prompt_fr text;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS options_fr jsonb;

UPDATE public.question_bank SET prompt_fr = CASE question_id
WHEN 'RT01' THEN 'Quel placement vous ressemble le plus ?'
WHEN 'RT02' THEN 'Un placement perd 20 %, mais votre analyse de départ est toujours valable. Que feriez-vous le plus probablement ?'
WHEN 'RT03' THEN 'Quel placement choisiriez-vous le plus facilement ?'
WHEN 'RT04' THEN 'Quelle phrase vous décrit le mieux comme investisseur ?'
WHEN 'RT05' THEN 'Votre placement ne progresse pas depuis 18 mois, alors que d’autres marchés montent. Que feriez-vous le plus probablement ?'
WHEN 'RT06' THEN 'Imaginez que votre portefeuille puisse perdre jusqu’à 15 % une mauvaise année, mais gagner jusqu’à 25 % une bonne année. Dans quelle mesure seriez-vous à l’aise avec cela ?'
WHEN 'RT07' THEN 'Le marché chute soudainement de 30 %. Quelle serait votre première réaction ?'
WHEN 'RT08' THEN 'Quand vous choisissez entre un placement plus sûr et un placement plus risqué, qu’est-ce qui compte le plus pour vous ?'
WHEN 'RT09' THEN 'Si un placement pouvait perdre temporairement 30 %, mais que vous croyiez toujours à son potentiel à long terme, dans quelle mesure seriez-vous prêt à investir ?'
WHEN 'RT10' THEN 'Quel énoncé décrit le mieux le niveau de risque que vous avez déjà accepté volontairement dans le passé ?'
WHEN 'RT07B' THEN 'Après une perte importante, dans quelle mesure réduiriez-vous le risque de vos prochains placements, même si vos objectifs à long terme n’ont pas changé ?'
WHEN 'BD01' THEN 'Quand vous entendez « placement à haut risque », à quoi pensez-vous en premier ?'
WHEN 'BD02' THEN 'Deux placements peuvent tous les deux perdre 20 %. Est-ce que cela veut automatiquement dire qu’ils ont le même niveau de risque ?'
WHEN 'BD03' THEN 'À quel point avez-vous confiance en votre capacité à prendre de bonnes décisions d’investissement ?'
WHEN 'BD04' THEN 'À long terme, à quelle fréquence pensez-vous que vos décisions d’investissement feront mieux que le marché ?'
WHEN 'BD05' THEN 'Si vous êtes sûr à 80 % qu’une prévision d’investissement sera correcte, à quelle fréquence pensez-vous avoir réellement raison ?'
WHEN 'BD06' THEN 'Quand quelqu’un vous parle d’un gros gain en investissement, à quel point cela influence-t-il vos propres décisions ?'
WHEN 'BD07' THEN 'Un placement a gagné 40 % au cours de la dernière année. Sa performance récente vous donne-t-elle davantage envie de l’acheter ?'
WHEN 'BD08' THEN 'Vous avez acheté un placement à 100 $ et il vaut maintenant 60 $. Pour décider quoi faire, quel chiffre regardez-vous le plus ?'
WHEN 'BD09' THEN 'Vos données appuient un placement, mais trois analystes crédibles ne sont pas d’accord avec vous. Quelle réaction vous ressemble le plus ?'
WHEN 'BD10' THEN 'Après avoir vendu un placement qui monte ensuite de 20 %, à quel point ce regret influencerait-il votre prochaine décision d’investissement ?'
WHEN 'BD11' THEN 'Vous avez un gain important sur un placement. Que feriez-vous le plus probablement ?'
WHEN 'BD12' THEN 'De nouvelles informations contredisent un placement que vous aimiez auparavant. Quelle est votre réaction ?'
WHEN 'BD13' THEN 'À quel point vous sentez-vous capable de comprendre les informations financières et d’investissement ?'
WHEN 'BD14' THEN 'Quand les marchés bougent fortement, à quel point est-il difficile pour vous de suivre une stratégie que vous aviez préparée ?'
WHEN 'BD15' THEN 'Une baisse du marché crée une occasion sur un placement que vous avez étudié. Qu’est-ce qui vous donne le plus envie d’acheter ?'
WHEN 'RC01' THEN 'Quel est approximativement le revenu annuel de votre ménage ?'
WHEN 'RC02' THEN 'Dans quelle mesure le revenu de votre ménage sur lequel vous comptez le plus est-il stable ?'
WHEN 'RC03' THEN 'Environ combien avez-vous d’actifs financiers que vous pourriez investir ?'
WHEN 'RC04' THEN 'Comment décririez-vous votre niveau d’endettement actuel ?'
WHEN 'RC05' THEN 'Pendant combien de mois votre épargne d’urgence pourrait-elle couvrir vos dépenses essentielles ?'
WHEN 'RC06' THEN 'Combien de personnes dépendent financièrement de votre revenu ?'
WHEN 'RC07' THEN 'Si votre portefeuille perdait 20 %, quel serait l’effet sur votre vie quotidienne ?'
WHEN 'RC08' THEN 'Si vous faisiez un seul placement, environ quel pourcentage de vos actifs financiers représenterait-il ?'
WHEN 'RC09' THEN 'Si ce placement perdait 20 %, auriez-vous encore assez d’épargne ou d’autres actifs pour faire face à une grosse dépense imprévue ?'
WHEN 'RC10' THEN 'À quel point la source de revenu sur laquelle vous comptez le plus est-elle sûre et stable ?'
END
WHERE version='v1.3' AND active=true;

-- French option labels. Values stay identical so scoring does not change.
UPDATE public.question_bank SET options_fr = CASE question_id
WHEN 'RT01' THEN '[{"label":"Rendement prévu de 6 %, très peu de fluctuations","value":"A"},{"label":"Rendement prévu de 10 %, fluctuations modérées","value":"B"},{"label":"Rendement prévu de 16 %, fortes fluctuations","value":"C"},{"label":"Rendement prévu de 25 %, très fortes fluctuations","value":"D"}]'::jsonb
WHEN 'RT02' THEN '[{"label":"Vendre la plupart ou la totalité","value":"A"},{"label":"Vendre une partie pour réduire le risque","value":"B"},{"label":"Garder le placement et attendre","value":"C"},{"label":"Acheter davantage","value":"D"}]'::jsonb
WHEN 'RT03' THEN '[{"label":"95 % de chances de gagner 4 000 $ ; 5 % de chances de perdre 500 $","value":"A"},{"label":"80 % de chances de gagner 6 000 $ ; 20 % de chances de perdre 2 000 $","value":"B"},{"label":"65 % de chances de gagner 10 000 $ ; 35 % de chances de perdre 5 000 $","value":"C"},{"label":"50 % de chances de gagner 16 000 $ ; 50 % de chances de perdre 8 000 $","value":"D"}]'::jsonb
WHEN 'RT04' THEN '[{"label":"Protéger mon capital passe avant tout","value":"A"},{"label":"J’accepte un peu de risque pour obtenir un meilleur rendement","value":"B"},{"label":"Je suis à l’aise avec de fortes fluctuations","value":"C"},{"label":"J’accepte de grosses pertes temporaires pour viser un gain important","value":"D"}]'::jsonb
WHEN 'RT05' THEN '[{"label":"Vendre et passer à autre chose","value":"A"},{"label":"Réévaluer le placement et peut-être réduire ma position","value":"B"},{"label":"Garder le placement si mon analyse de départ reste valable","value":"C"},{"label":"Garder le placement et envisager d’en acheter davantage si l’analyse reste solide","value":"D"}]'::jsonb
WHEN 'RT06' THEN '[{"label":"Très mal à l’aise","value":"A"},{"label":"Plutôt mal à l’aise","value":"B"},{"label":"À l’aise","value":"C"},{"label":"Très à l’aise","value":"D"}]'::jsonb
WHEN 'RT07' THEN '[{"label":"Vendre rapidement pour éviter d’autres pertes","value":"A"},{"label":"Attendre et réévaluer avant d’agir","value":"B"},{"label":"Garder mes placements malgré la baisse","value":"C"},{"label":"Chercher des occasions d’acheter","value":"D"}]'::jsonb
WHEN 'RT08' THEN '[{"label":"Éviter toute perte possible","value":"A"},{"label":"Trouver un équilibre entre risque et rendement","value":"B"},{"label":"Maximiser le rendement attendu","value":"C"},{"label":"Profiter du plus grand potentiel de gain possible","value":"D"}]'::jsonb
WHEN 'RT09' THEN '[{"label":"Je l’éviterais","value":"A"},{"label":"Je considérerais seulement un petit montant","value":"B"},{"label":"Je serais à l’aise d’investir si les perspectives à long terme restent solides","value":"C"},{"label":"Je l’envisagerais sérieusement malgré la perte possible","value":"D"}]'::jsonb
WHEN 'RT10' THEN '[{"label":"J’ai généralement évité les gros risques","value":"A"},{"label":"J’ai parfois pris plus de risque que je ne le souhaitais ensuite","value":"B"},{"label":"J’ai déjà accepté volontairement un risque important","value":"C"},{"label":"J’ai déjà accepté un risque très élevé pour viser un meilleur rendement","value":"D"}]'::jsonb
WHEN 'RT07B' THEN '[{"label":"Très probable","value":"A"},{"label":"Assez probable","value":"B"},{"label":"Peu probable","value":"C"},{"label":"Très peu probable","value":"D"}]'::jsonb
WHEN 'BD01' THEN '[{"label":"Un risque élevé de perdre de l’argent","value":"A"},{"label":"De fortes variations de prix","value":"B"},{"label":"Beaucoup d’incertitude","value":"C"},{"label":"Une occasion que je pourrais manquer si je n’investis pas","value":"D"}]'::jsonb
WHEN 'BD02' THEN '[{"label":"Oui","value":"A"},{"label":"Pas forcément","value":"B"},{"label":"Non — le risque dépend aussi d’autres facteurs","value":"C"}]'::jsonb
WHEN 'BD07' THEN '[{"label":"Beaucoup moins intéressé","value":"A"},{"label":"À peu près autant","value":"B"},{"label":"Un peu plus intéressé","value":"C"},{"label":"Beaucoup plus intéressé","value":"D"}]'::jsonb
WHEN 'BD08' THEN '[{"label":"Le prix de 100 $ que j’ai payé","value":"A"},{"label":"Le prix actuel de 60 $","value":"B"},{"label":"La valeur actuelle du placement selon ses fondamentaux","value":"C"}]'::jsonb
WHEN 'BD09' THEN '[{"label":"Je cherche surtout les informations qui confirment mon point de vue","value":"A"},{"label":"J’écoute leur avis, mais je me concentre surtout sur les éléments qui soutiennent mon idée","value":"B"},{"label":"Je compare activement mon idée à leurs arguments","value":"C"},{"label":"Je prends du recul et cherche plus d’informations avant de décider","value":"D"}]'::jsonb
WHEN 'BD11' THEN '[{"label":"Vendre pour sécuriser le gain","value":"A"},{"label":"Vendre une partie et garder le reste","value":"B"},{"label":"Garder le placement si mon analyse reste solide","value":"C"},{"label":"Acheter davantage si les perspectives se sont améliorées","value":"D"}]'::jsonb
WHEN 'BD12' THEN '[{"label":"Je défends généralement mon point de vue de départ","value":"A"},{"label":"Je deviens prudent","value":"B"},{"label":"Je réévalue le placement","value":"C"},{"label":"Je change de décision si les nouvelles informations le justifient","value":"D"}]'::jsonb
WHEN 'BD15' THEN '[{"label":"Je préfère attendre que l’incertitude baisse","value":"A"},{"label":"Le prix semble intéressant par rapport aux fondamentaux","value":"B"},{"label":"Le potentiel de rendement à long terme est très intéressant","value":"C"},{"label":"La baisse crée une occasion d’agir pendant que les autres ont peur","value":"D"}]'::jsonb
WHEN 'RC01' THEN '[{"label":"Moins de 40 000 $","value":"A"},{"label":"40 000 $ à 79 999 $","value":"B"},{"label":"80 000 $ à 149 999 $","value":"C"},{"label":"150 000 $ ou plus","value":"D"}]'::jsonb
WHEN 'RC02' THEN '[{"label":"Très variable ou incertain","value":"A"},{"label":"Assez variable","value":"B"},{"label":"Plutôt stable","value":"C"},{"label":"Très stable","value":"D"}]'::jsonb
WHEN 'RC03' THEN '[{"label":"Moins de 25 000 $","value":"A"},{"label":"25 000 $ à 99 999 $","value":"B"},{"label":"100 000 $ à 499 999 $","value":"C"},{"label":"500 000 $ ou plus","value":"D"}]'::jsonb
WHEN 'RC04' THEN '[{"label":"Élevé — il limite beaucoup ce que je peux investir","value":"A"},{"label":"Modéré","value":"B"},{"label":"Faible","value":"C"},{"label":"Très faible ou aucune dette importante","value":"D"}]'::jsonb
WHEN 'RC05' THEN '[{"label":"Moins d’un mois","value":"A"},{"label":"1 à 3 mois","value":"B"},{"label":"3 à 6 mois","value":"C"},{"label":"Plus de 6 mois","value":"D"}]'::jsonb
WHEN 'RC06' THEN '[{"label":"4 personnes ou plus","value":"A"},{"label":"2 à 3","value":"B"},{"label":"1","value":"C"},{"label":"Personne","value":"D"}]'::jsonb
WHEN 'RC07' THEN '[{"label":"Je pourrais avoir du mal à payer mes dépenses essentielles","value":"A"},{"label":"Je devrais réduire fortement mon train de vie","value":"B"},{"label":"Ce serait difficile, mais gérable","value":"C"},{"label":"Cela aurait peu d’effet sur mon train de vie","value":"D"}]'::jsonb
WHEN 'RC08' THEN '[{"label":"Plus de 50 %","value":"A"},{"label":"25 % à 50 %","value":"B"},{"label":"10 % à 25 %","value":"C"},{"label":"Moins de 10 %","value":"D"}]'::jsonb
WHEN 'RC09' THEN '[{"label":"Non","value":"A"},{"label":"Probablement pas","value":"B"},{"label":"Probablement oui","value":"C"},{"label":"Certainement oui","value":"D"}]'::jsonb
WHEN 'RC10' THEN '[{"label":"Incertaine ou à risque important","value":"A"},{"label":"Plutôt incertaine","value":"B"},{"label":"Généralement sûre","value":"C"},{"label":"Très sûre","value":"D"}]'::jsonb
END
WHERE version='v1.3' AND active=true;

-- Fill the remaining scale questions' French option labels through a small JSON object.
UPDATE public.question_bank SET options_fr = '[{"label":"Pas du tout","value":0},{"label":"1","value":1},{"label":"2","value":2},{"label":"3","value":3},{"label":"4","value":4},{"label":"5","value":5},{"label":"6","value":6},{"label":"7","value":7},{"label":"8","value":8},{"label":"9","value":9},{"label":"Tout à fait","value":10}]'::jsonb
WHERE version='v1.3' AND active=true AND question_type='scale';

COMMIT;